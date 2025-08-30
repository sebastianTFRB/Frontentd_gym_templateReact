import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Label, TextInput, Select, Spinner } from "flowbite-react";

import { getCliente, Cliente } from "../../../api/clientes";
import { getVentasMembresia, VentaMembresia } from "../../../api/venta_membresia";
import { getMembresias } from "../../../api/membresias";
import { updateClienteConMembresia, ActualizarClienteYVentaRequest, EstadoMembresia } from "../../../api/clientes_membresia";

// Helpers fecha
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addMonthsStr(isoDate: string, months: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setMonth(base.getMonth() + months);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
}

// Tipos de membresía
type Membresia = {
  id: number;
  nombre_membresia: string;
  precio?: number;
  precio_base?: number;
  valor?: number;
  cantidad_sesiones?: number;
};

function extractPrecioYSesiones(m?: Membresia) {
  if (!m) return { precio: undefined as number | undefined, sesiones: undefined as number | undefined };
  const precio = (m.precio ?? m.precio_base ?? m.valor) as number | undefined;
  const sesiones = m.cantidad_sesiones as number | undefined;
  return { precio, sesiones };
}

function sortVentasDesc(ventas: VentaMembresia[]) {
  return [...ventas].sort((a, b) => {
    const da = new Date(a.fecha_inicio as any).getTime() || 0;
    const db = new Date(b.fecha_inicio as any).getTime() || 0;
    return db - da;
  });
}

export default function EditarClienteConMembresia() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);
  const navigate = useNavigate();

  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<string>("");

  const [venta, setVenta] = useState<VentaMembresia | null>(null);
  const [ventaId, setVentaId] = useState<number | undefined>(undefined);
  const [idMembresia, setIdMembresia] = useState<number | "">("");
  const [fechaInicio, setFechaInicio] = useState<string>(todayStr());
  const [fechaFin, setFechaFin] = useState<string>(() => addMonthsStr(todayStr(), 1));
  const [precioFinal, setPrecioFinal] = useState<string>("");
  const [sesionesRestantes, setSesionesRestantes] = useState<string>("");
  const estado: EstadoMembresia = "activa";

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([getCliente(clienteId), getVentasMembresia(), getMembresias()])
      .then(([cliRes, ventasRes, membRes]) => {
        if (!mounted) return;

        const c = cliRes.data as Cliente;
        setCliente(c);
        setNombre(c.nombre || "");
        setApellido(c.apellido || "");
        setDocumento(c.documento || "");
        setCorreo(c.correo || "");
        setTelefono(c.telefono || "");
        setDireccion(c.direccion || "");
        if (c.fecha_nacimiento) {
          const d = new Date(c.fecha_nacimiento as any);
          if (!Number.isNaN(d.getTime())) {
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            setFechaNacimiento(iso);
          }
        }

        const ventas = Array.isArray(ventasRes.data) ? ventasRes.data : ventasRes.data?.data || [];
        const ventasCliente = sortVentasDesc(ventas.filter((v: any) => v.id_cliente === clienteId));
        const last = ventasCliente[0] || null;
        setVenta(last || null);
        if (last) {
          setVentaId(last.id);
          setIdMembresia(last.id_membresia || "");
          if (last.fecha_inicio) {
            const di = new Date(last.fecha_inicio);
            const iso = `${di.getFullYear()}-${String(di.getMonth() + 1).padStart(2, "0")}-${String(di.getDate()).padStart(2, "0")}`;
            setFechaInicio(iso);
          }
          if (last.fecha_fin) {
            const df = new Date(last.fecha_fin);
            const iso = `${df.getFullYear()}-${String(df.getMonth() + 1).padStart(2, "0")}-${String(df.getDate()).padStart(2, "0")}`;
            setFechaFin(iso);
          }
          setPrecioFinal(last.precio_final != null ? String(last.precio_final) : "");
          setSesionesRestantes(last.sesiones_restantes != null ? String(last.sesiones_restantes) : "");
        }

        const membs = Array.isArray(membRes.data) ? membRes.data : membRes.data?.data || [];
        setMembresias(membs);
      })
      .catch((e) => {
        console.error(e);
        if (mounted) setError("No se pudo cargar la información.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [clienteId]);

  // recalcular fecha fin al cambiar inicio
  useEffect(() => {
    if (!fechaInicio) return;
    setFechaFin(addMonthsStr(fechaInicio, 1));
  }, [fechaInicio]);

  // autocompletar precio/sesiones al cambiar membresía
  useEffect(() => {
    if (idMembresia === "") return;
    const m = membresias.find((x) => x.id === Number(idMembresia));
    const { precio, sesiones } = extractPrecioYSesiones(m);
    if (precio != null && Number.isFinite(precio)) setPrecioFinal(String(precio));
    if (sesiones != null && Number.isFinite(sesiones)) setSesionesRestantes(String(sesiones));
  }, [idMembresia, membresias]);

  // ✅ Validación de rango de fechas
  const dateInvalid = useMemo(() => {
    if (!fechaInicio || !fechaFin) return false;
    const di = Date.parse(fechaInicio);
    const df = Date.parse(fechaFin);
    if (Number.isNaN(di) || Number.isNaN(df)) return false;
    return di > df;
  }, [fechaInicio, fechaFin]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (dateInvalid) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }
    if (!nombre.trim() || !apellido.trim() || !documento.trim()) {
      setError("Nombre, apellido y documento son obligatorios.");
      return;
    }
    if (idMembresia === "") {
      setError("Selecciona una membresía.");
      return;
    }

    setSaving(true);
    try {
      const payload: ActualizarClienteYVentaRequest = {
        cliente: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          documento: documento.trim(),
          ...(fechaNacimiento ? { fecha_nacimiento: fechaNacimiento } : {}),
          correo: correo.trim() || undefined,
          telefono: telefono.trim() || undefined,
          direccion: direccion.trim() || undefined,
          huella_base64: "",
        },
        venta: {
          id: ventaId,
          id_membresia: Number(idMembresia),
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
          precio_final: precioFinal.trim() === "" ? undefined : Number(precioFinal),
          sesiones_restantes: sesionesRestantes.trim() === "" ? undefined : Number(sesionesRestantes),
          estado: "activa",
        },
      };

      await updateClienteConMembresia(clienteId, payload);
      setInfo("Cambios guardados.");
      navigate("/clientes/membresias");
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.detail || e?.message || "Error al guardar.";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const titulo = useMemo(
    () => (cliente ? `Editar: ${cliente.nombre} ${cliente.apellido}` : "Editar cliente"),
    [cliente]
  );

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <header className="flex items-center justify-between mb-3">
        <h5 className="card-title">{titulo}</h5>
        <Link to="/clientes/membresias" className="btn">Volver</Link>
      </header>

      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
      {info && <div className="mb-3 text-green-600 text-sm">{info}</div>}

      {loading ? (
        <div className="flex items-center gap-2">
          <Spinner /><span>Cargando…</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Cliente */}
          <section>
            <h6 className="font-semibold mb-2">Datos del cliente</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label htmlFor="nombre" value="Nombre *" /><TextInput id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></div>
              <div><Label htmlFor="apellido" value="Apellido *" /><TextInput id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required /></div>
              <div><Label htmlFor="documento" value="Documento *" /><TextInput id="documento" value={documento} onChange={(e) => setDocumento(e.target.value)} required /></div>

              <div><Label htmlFor="fecha_nacimiento" value="Fecha de nacimiento" /><TextInput id="fecha_nacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} /></div>
              <div><Label htmlFor="correo" value="Correo" /><TextInput id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} /></div>
              <div><Label htmlFor="telefono" value="Teléfono" /><TextInput id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
              <div><Label htmlFor="direccion" value="Dirección" /><TextInput id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} /></div>
            </div>
          </section>

          {/* Venta */}
          <section>
            <h6 className="font-semibold mb-2">Membresía</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="id_membresia" value="Membresía *" />
                <Select
                  id="id_membresia"
                  value={idMembresia}
                  onChange={(e) => setIdMembresia(e.target.value ? Number(e.target.value) : "")}
                  required
                >
                  <option value="">Selecciona…</option>
                  {membresias.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre_membresia}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="fecha_inicio" value="Fecha inicio" />
                <TextInput
                  id="fecha_inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  color={dateInvalid ? "failure" : undefined}
                />
              </div>

              <div>
                <Label htmlFor="fecha_fin" value="Fecha fin (auto +1 mes)" />
                <TextInput
                  id="fecha_fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  color={dateInvalid ? "failure" : undefined}
                  helperText={
                    dateInvalid ? (
                      <span className="text-red-600">
                        La fecha de fin debe ser el mismo día o posterior a la fecha de inicio.
                      </span>
                    ) : undefined
                  }
                />
              </div>

              <div>
                <Label htmlFor="precio_final" value="Precio" />
                <TextInput
                  id="precio_final"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioFinal}
                  onChange={(e) => setPrecioFinal(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="sesiones" value="Sesiones restantes" />
                <TextInput
                  id="sesiones"
                  type="number"
                  min="0"
                  step="1"
                  value={sesionesRestantes}
                  onChange={(e) => setSesionesRestantes(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="estado" value="Estado" />
                <TextInput id="estado" value="Activo" readOnly />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn" disabled={saving || dateInvalid}>
              {saving ? <span className="inline-flex items-center gap-2"><Spinner size="sm" /> Guardando…</span> : "Guardar"}
            </button>
            <Link to="/clientes/membresias" className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      )}
    </div>
  );
}
