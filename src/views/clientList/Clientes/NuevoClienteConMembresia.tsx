import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Label, TextInput, Select, Spinner, Button } from "flowbite-react";
import { createClienteConMembresia } from "../../../api/clientes_membresia";
import { getMembresias } from "../../../api/membresias";

// ===== Helpers de fecha
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function addMonthsStr(isoDate: string, months: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setMonth(base.getMonth() + months);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
    base.getDate()
  ).padStart(2, "0")}`;
}

// ===== OPFS check
function opfsSupported() {
  return typeof navigator !== "undefined" && !!(navigator.storage as any)?.getDirectory;
}

// ===== OPFS helpers
function b64ToBlob(b64: string, mime = "image/jpeg"): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
async function opfsSaveBase64(relPath: string, b64: string) {
  // @ts-ignore
  const root: FileSystemDirectoryHandle = await navigator.storage.getDirectory();
  const parts = relPath.split("/").filter(Boolean);
  const fileName = parts.pop()!;
  let dir = root;
  for (const p of parts) {
    // @ts-ignore
    dir = await dir.getDirectoryHandle(p, { create: true });
  }
  // @ts-ignore
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  // @ts-ignore
  const writable = await fileHandle.createWritable();
  await writable.write(b64ToBlob(b64, "image/jpeg"));
  await writable.close();
}

// ===== Tipos locales del payload
type EstadoMembresia = "activa" | "vencida" | "sin_membresia";
interface ClientePayload {
  nombre: string;
  apellido: string;
  documento: string;
  fecha_nacimiento?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  fotografia?: string;   // opcional (string), hoy tu back lo acepta
  huella_base64: string; // string vacío
}
interface VentaPayload {
  id_membresia: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  precio_final?: number;
  sesiones_restantes?: number;
  estado: EstadoMembresia;
}
interface ClienteMembresiaPayload {
  cliente: ClientePayload;
  venta: VentaPayload;
}

// ===== Membresías
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

export default function NuevoClienteConMembresia() {
  const navigate = useNavigate();

  // Catálogos
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);

  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Cliente
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<string>("");

  // Webcam
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);
  const [camError, setCamError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Venta
  const [idMembresia, setIdMembresia] = useState<number | "">("");
  const [fechaInicio, setFechaInicio] = useState<string>(todayStr());
  const [fechaFin, setFechaFin] = useState<string>(() => addMonthsStr(todayStr(), 1));
  const [precioFinal, setPrecioFinal] = useState<string>("");
  const [sesionesRestantes, setSesionesRestantes] = useState<string>("");

  // Fecha fin auto +1 mes
  useEffect(() => {
    setFechaFin(addMonthsStr(fechaInicio, 1));
  }, [fechaInicio]);

  // Cargar membresías
  useEffect(() => {
    let mounted = true;
    setLoadingCat(true);
    getMembresias()
      .then((res) => {
        if (!mounted) return;
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setMembresias(arr);
      })
      .catch((e) => {
        console.error(e);
        if (mounted) setError("No se pudieron cargar las membresías.");
      })
      .finally(() => mounted && setLoadingCat(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Autocompletar desde membresía
  useEffect(() => {
    if (idMembresia === "") return;
    const m = membresias.find((x) => x.id === Number(idMembresia));
    const { precio, sesiones } = extractPrecioYSesiones(m);
    if (precio != null && Number.isFinite(precio)) setPrecioFinal(String(precio));
    if (sesiones != null && Number.isFinite(sesiones)) setSesionesRestantes(String(sesiones));
  }, [idMembresia, membresias]);

  // Asignar stream a video cuando camOn = true
  useEffect(() => {
    if (!camOn) return;
    const v = videoRef.current;
    const stream = mediaStreamRef.current;
    if (!v || !stream) return;
    v.srcObject = stream as any;
    v.muted = true;
    const onLoaded = () => setVideoReady(true);
    v.addEventListener("loadedmetadata", onLoaded);
    v.play().catch((err) => console.error("video.play() falló:", err));
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      setVideoReady(false);
    };
  }, [camOn]);

  // Cleanup global
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Cámara
  const startCamera = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setCamOn(true);
    } catch (e: any) {
      console.error(e);
      setCamError("No se pudo acceder a la cámara. Permisos o dispositivo.");
    }
  };

  const stopCamera = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return;
    const v = videoRef.current, c = canvasRef.current;
    const w = v.videoWidth || 640, h = v.videoHeight || 480;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    const b64 = dataUrl.split(",")[1] || "";
    setFotoBase64(b64);
    stopCamera();
  };

  const clearPhoto = () => {
    setFotoBase64(undefined);
  };

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

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
      let fotografia: string | undefined = undefined;

      // Guardado local en OPFS (solo si está disponible)
      if (fotoBase64) {
        if (!opfsSupported()) {
          setError(
            "Tu navegador/origen no permite OPFS. Usa HTTPS o http://localhost en Chrome/Edge/Brave."
          );
        } else {
          try {
            // @ts-ignore
            await navigator.storage.persist?.();
          } catch {}
          const relPath = `fotos/${documento}.jpg`;
          try {
            await opfsSaveBase64(relPath, fotoBase64);
            fotografia = `opfs:${relPath}`; // opcional para tu back (string)
            setInfo(`Foto guardada localmente como ${relPath} (OPFS).`);
          } catch (writeErr) {
            console.error(writeErr);
            setError("No se pudo guardar la foto en OPFS.");
          }
        }
      }

      const payload: ClienteMembresiaPayload = {
        cliente: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          documento: documento.trim(),
          ...(fechaNacimiento ? { fecha_nacimiento: fechaNacimiento } : {}),
          correo: correo.trim() || undefined,
          telefono: telefono.trim() || undefined,
          direccion: direccion.trim() || undefined,
          fotografia: fotografia ?? "", // si no se guardó, enviamos ""
          huella_base64: "", // requerido por el schema
        },
        venta: {
          id_membresia: Number(idMembresia),
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
          precio_final: precioFinal.trim() === "" ? undefined : Number(precioFinal),
          sesiones_restantes:
            sesionesRestantes.trim() === "" ? undefined : Number(sesionesRestantes),
          estado: "activa",
        },
      };

      await createClienteConMembresia(payload);
      navigate("/clientes/membresias");
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.detail || e?.message || "Error al guardar.";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w/full break-words">
      <header className="flex items-center justify-between mb-3">
        <h5 className="card-title">Nuevo cliente con membresía</h5>
        <Link to="/clientes" className="btn">Volver</Link>
      </header>

      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
      {info && <div className="mb-3 text-green-600 text-sm">{info}</div>}

      {loadingCat ? (
        <div className="flex items-center gap-2">
          <Spinner /><span>Cargando catálogos…</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Datos del cliente */}
          <section>
            <h6 className="font-semibold mb-2">Datos del cliente</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nombre" value="Nombre *" />
                <TextInput id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="apellido" value="Apellido *" />
                <TextInput id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="documento" value="Documento *" />
                <TextInput id="documento" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="fecha_nacimiento" value="Fecha de nacimiento" />
                <TextInput
                  id="fecha_nacimiento"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="correo" value="Correo" />
                <TextInput id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="telefono" value="Teléfono" />
                <TextInput id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="direccion" value="Dirección" />
                <TextInput id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Foto por webcam */}
          <section>
            <h6 className="font-semibold mb-2">Fotografía</h6>
            {!fotoBase64 && !camOn && (
              <div className="flex items-center gap-3">
                <Button onClick={startCamera}>Abrir cámara</Button>
                {camError && <span className="text-red-600 text-sm">{camError}</span>}
              </div>
            )}
            {camOn && (
              <div className="flex flex-col gap-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-md rounded-md border aspect-video bg-black"
                />
                <div className="flex items-center gap-3">
                  <Button onClick={takePhoto} disabled={!videoReady}>Tomar foto</Button>
                  <Button color="light" onClick={stopCamera}>Cancelar</Button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
            {fotoBase64 && !camOn && (
              <div className="flex items-center gap-4">
                <img
                  src={`data:image/jpeg;base64,${fotoBase64}`}
                  alt="preview"
                  className="h-32 w-32 object-cover rounded-md border"
                />
                <div className="flex flex-col gap-2">
                  <Button color="light" onClick={clearPhoto}>Cambiar foto</Button>
                </div>
              </div>
            )}
          </section>

          {/* Venta */}
          <section>
            <h6 className="font-semibold mb-2">Venta de membresía</h6>
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
                <TextInput id="fecha_inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="fecha_fin" value="Fecha fin (auto +1 mes)" />
                <TextInput id="fecha_fin" type="date" value={fechaFin} readOnly />
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
            <button type="submit" className="btn" disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" /> Guardando…
                </span>
              ) : (
                "Guardar"
              )}
            </button>
            <Link to="/clientes" className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      )}
    </div>
  );
}
