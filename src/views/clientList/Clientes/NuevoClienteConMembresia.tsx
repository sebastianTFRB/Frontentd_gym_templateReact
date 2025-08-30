import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Spinner } from "flowbite-react";
import { Icon } from "@iconify/react";
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

// ===== Subir foto al backend
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function b64ToBlob(b64: string, mime = "image/jpeg"): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function uploadBase64ToBackend(
  documento: string,
  base64: string,
  mime: "image/jpeg" | "image/png" = "image/jpeg"
): Promise<string> {
  const blob = b64ToBlob(base64, mime);
  const fd = new FormData();
  fd.append("documento", documento);
  fd.append("file", blob, `${documento}.${mime === "image/png" ? "png" : "jpg"}`);

  const res = await fetch(`${API_BASE}/uploads/files/upload-foto`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falló el upload (${res.status}): ${text || res.statusText}`);
  }
  const data = await res.json();
  if (!data?.ruta) throw new Error("El backend no devolvió 'ruta'.");
  return data.ruta as string; // p.ej. "/media/fotos/123.jpg"
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
  fotografia?: string;   // ruta devuelta por el backend
  huella_base64: string; // vacío
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
  const [touchedFin, setTouchedFin] = useState(false);
  const [precioFinal, setPrecioFinal] = useState<string>("");
  const [sesionesRestantes, setSesionesRestantes] = useState<string>("");

  // Fecha fin auto +1 mes (solo si el usuario NO la tocó)
  useEffect(() => {
    if (!touchedFin) setFechaFin(addMonthsStr(fechaInicio, 1));
  }, [fechaInicio, touchedFin]);

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

  const clearPhoto = () => setFotoBase64(undefined);

  // ✅ Validaciones
  const dateInvalid = useMemo(() => {
    if (!fechaInicio || !fechaFin) return false;
    const di = Date.parse(fechaInicio);
    const df = Date.parse(fechaFin);
    if (Number.isNaN(di) || Number.isNaN(df)) return false;
    return di > df;
  }, [fechaInicio, fechaFin]);

  const precioInvalid = useMemo(() => {
    if (precioFinal.trim() === "") return false;
    const n = Number(precioFinal);
    return Number.isNaN(n) || n < 0;
  }, [precioFinal]);

  // ===== Clases input del template (con borde rojo si hay error)
  const baseInput =
    "block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg";

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (dateInvalid) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }
    if (precioInvalid) {
      setError("El precio debe ser un número mayor o igual a 0.");
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
      let fotografiaRuta = "";

      // Si hay foto, súbela primero al backend y obtén la 'ruta'
      if (fotoBase64) {
        const ruta = await uploadBase64ToBackend(documento.trim(), fotoBase64, "image/jpeg");
        fotografiaRuta = ruta; // p.ej. "/media/fotos/123.jpg"
        setInfo("Foto subida correctamente.");
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
          fotografia: fotografiaRuta,
          huella_base64: "",
        },
        venta: {
          id_membresia: Number(idMembresia),
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
          precio_final: precioFinal.trim() === "" ? undefined : Number(precioFinal),
          sesiones_restantes:
            sesionesRestantes.trim() === "" ? undefined : Number(sesionesRestantes),
          estado: "activa" as EstadoMembresia,
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
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      {/* Header con botón Volver estilo template */}
      <header className="flex items-center justify-between mb-4">
        <h5 className="card-title">Nuevo cliente con membresía</h5>

        <Link
          to="/clientes/membresias"
          role="button"
          className="flex items-center justify-center px-4 py-3 gap-2 text-[15px] leading-[normal] font-normal text-white dark:text-white bg-primary rounded-xl hover:text-white hover:bg-primary dark:hover:text-white shadow-btnshdw"
        >
          <Icon icon="solar:alt-arrow-left-outline" width="18" height="18" />
          <span>Volver</span>
        </Link>
      </header>

      {error && (
        <div className="mb-3 text-sm rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-3 text-sm rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2">
          {info}
        </div>
      )}

      {loadingCat ? (
        <div className="flex items-center gap-2">
          <Spinner />
          <span>Cargando catálogos…</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Datos del cliente */}
          <section>
            <h6 className="font-semibold mb-3">Datos del cliente</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nombre */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="nombre" className="sr-only">Nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    className={baseInput}
                    placeholder="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Apellido */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="apellido" className="sr-only">Apellido</label>
                  <input
                    id="apellido"
                    type="text"
                    className={baseInput}
                    placeholder="Apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Documento */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="documento" className="sr-only">Documento</label>
                  <input
                    id="documento"
                    type="text"
                    className={baseInput}
                    placeholder="Documento"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Fecha nacimiento */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="fecha_nacimiento" className="sr-only">Fecha de nacimiento</label>
                  <input
                    id="fecha_nacimiento"
                    type="date"
                    className={baseInput}
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                  />
                </div>
              </div>

              {/* Correo */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="correo" className="sr-only">Correo</label>
                  <input
                    id="correo"
                    type="email"
                    className={baseInput}
                    placeholder="Correo"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="telefono" className="sr-only">Teléfono</label>
                  <input
                    id="telefono"
                    type="text"
                    className={baseInput}
                    placeholder="Teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="direccion" className="sr-only">Dirección</label>
                  <input
                    id="direccion"
                    type="text"
                    className={baseInput}
                    placeholder="Dirección"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Foto por webcam */}
          <section>
            <h6 className="font-semibold mb-3">Fotografía</h6>
            {!fotoBase64 && !camOn && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white shadow-btnshdw hover:bg-primary/90"
                >
                  <Icon icon="solar:camera-outline" width="18" height="18" />
                  Abrir cámara
                </button>
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
                  className="w-full max-w-md rounded-xl border aspect-video bg-black"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={takePhoto}
                    disabled={!videoReady}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white shadow-btnshdw hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Icon icon="solar:square-round-check-outline" width="18" height="18" />
                    Tomar foto
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Icon icon="solar:close-circle-outline" width="18" height="18" />
                    Cancelar
                  </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {fotoBase64 && !camOn && (
              <div className="flex items-center gap-4">
                <img
                  src={`data:image/jpeg;base64,${fotoBase64}`}
                  alt="preview"
                  className="h-32 w-32 object-cover rounded-xl border"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Icon icon="solar:refresh-outline" width="18" height="18" />
                    Cambiar foto
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Venta */}
          <section>
            <h6 className="font-semibold mb-3">Venta de membresía</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Membresía */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="id_membresia" className="sr-only">Membresía</label>
                  <select
                    id="id_membresia"
                    className={baseInput}
                    value={idMembresia}
                    onChange={(e) => setIdMembresia(e.target.value ? Number(e.target.value) : "")}
                    required
                  >
                    <option value="">Selecciona…</option>
                    {membresias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre_membresia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha inicio */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="fecha_inicio" className="sr-only">Fecha inicio</label>
                  <input
                    id="fecha_inicio"
                    type="date"
                    className={`${baseInput} ${dateInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    aria-invalid={dateInvalid || undefined}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
              </div>

              {/* Fecha fin */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="fecha_fin" className="sr-only">Fecha fin</label>
                  <input
                    id="fecha_fin"
                    type="date"
                    className={`${baseInput} ${dateInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    aria-invalid={dateInvalid || undefined}
                    value={fechaFin}
                    onChange={(e) => {
                      setFechaFin(e.target.value);
                      setTouchedFin(true);
                    }}
                  />
                  {dateInvalid && (
                    <p className="mt-1 text-xs text-red-600">
                      La fecha de fin debe ser el mismo día o posterior a la fecha de inicio.
                    </p>
                  )}
                </div>
              </div>

              {/* Precio */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="precio_final" className="sr-only">Precio</label>
                  <input
                    id="precio_final"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    className={`${baseInput} ${precioInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    aria-invalid={precioInvalid || undefined}
                    value={precioFinal}
                    onChange={(e) => setPrecioFinal(e.target.value)}
                  />
                  {precioInvalid && (
                    <p className="mt-1 text-xs text-red-600">El precio debe ser mayor o igual a 0.</p>
                  )}
                </div>
              </div>

              {/* Sesiones */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="sesiones" className="sr-only">Sesiones restantes</label>
                  <input
                    id="sesiones"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    className={baseInput}
                    value={sesionesRestantes}
                    onChange={(e) => setSesionesRestantes(e.target.value)}
                  />
                </div>
              </div>

              {/* Estado (solo lectura) */}
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="estado" className="sr-only">Estado</label>
                  <input id="estado" type="text" className={baseInput} value="Activo" readOnly />
                </div>
              </div>
            </div>
          </section>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || dateInvalid || precioInvalid}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white shadow-btnshdw hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  Guardando…
                </>
              ) : (
                <>
                  <Icon icon="solar:floppy-disk-outline" width="18" height="18" />
                  Guardar
                </>
              )}
            </button>

            <Link
              to="/clientes/membresias"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <Icon icon="solar:close-circle-outline" width="18" height="18" />
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
