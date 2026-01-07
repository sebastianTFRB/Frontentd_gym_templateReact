import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Spinner } from "flowbite-react";
import { Icon } from "@iconify/react";
import { createClienteConMembresia } from "../../../api/clientes_membresia";
import { getMembresias } from "../../../api/membresias";
import { API_BASE_URL } from "../../../api/apiConfig";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

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

function parseDateOnlyLocal(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d)); // <-- local
  }
  const d = new Date(s!);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDateInputLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// suma días completos en local (si quieres inclusivo, usa days-1)
function addDaysStr(isoDate: string, days: number) {
  const d0 = parseDateOnlyLocal(isoDate);
  if (!d0) return isoDate;
  const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
  d.setDate(d.getDate() + days);
  return fmtDateInputLocal(d);
}

// ===== Subir foto al backend
const API_BASE = API_BASE_URL;

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

  let token = "";
  try {
    const item = localStorage.getItem("auth-storage");
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed.state?.token) token = parsed.state.token;
    }
  } catch (e) { }

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}/uploads/files/upload-foto`, {
    method: "POST",
    headers,
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
  fotografia?: string;
  huella_base64: string;
  id_tipo_descuento?: number | 1;
  observaciones?: string;
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

  // posibles nombres para duración (días)
  duracion_dias?: number;
  dias_duracion?: number;
  dias?: number;
  dias_vigencia?: number;
};

function extractPrecioYSesiones(m?: Membresia) {
  if (!m) return { precio: undefined as number | undefined, sesiones: undefined as number | undefined };
  const precio = (m.precio ?? m.precio_base ?? m.valor) as number | undefined;
  const sesiones = m.cantidad_sesiones as number | undefined;
  return { precio, sesiones };
}
function defaultSessionsFor(membresias: Membresia[], id?: number | ""): number | undefined {
  if (!id) return undefined;
  const m = membresias.find((x) => x.id === Number(id));
  return m?.cantidad_sesiones;
}
function durationDaysFor(membresias: Membresia[], id?: number | ""): number | undefined {
  if (!id) return undefined;
  const m = membresias.find((x) => x.id === Number(id));
  if (!m) return undefined;
  const n = (m.duracion_dias ?? m.dias_duracion ?? m.dias ?? m.dias_vigencia) as number | undefined;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function NuevoClienteConMembresia() {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

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
  const [observaciones, setObservaciones] = useState("");
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

  // Fecha fin auto (si el usuario NO la tocó): usa duración en días, si no hay → +1 mes
  useEffect(() => {
    if (touchedFin) return;
    const dur = durationDaysFor(membresias, idMembresia);
    if (dur) {
      setFechaFin(addDaysStr(fechaInicio, dur)); // usa (dur - 1) si quieres inclusivo
    } else {
      setFechaFin(addMonthsStr(fechaInicio, 1));
    }
  }, [fechaInicio, touchedFin, idMembresia, membresias]);

  // Cargar membresías
  useEffect(() => {
    let mounted = true;
    setLoadingCat(true);

    getMembresias()
      .then((res) => {
        if (!mounted) return;
        setMembresias(res.data);
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

  // Autocompletar desde membresía + reiniciar sesiones + ajustar fecha fin con duración
  useEffect(() => {
    if (idMembresia === "") return;
    const m = membresias.find((x) => x.id === Number(idMembresia));
    const { precio, sesiones } = extractPrecioYSesiones(m);
    if (precio != null && Number.isFinite(precio)) setPrecioFinal(String(precio));
    if (sesiones != null && Number.isFinite(sesiones)) setSesionesRestantes(String(sesiones));

    // al seleccionar membresía, si el usuario no tocó fecha fin, calcúlala desde hoy/fechaInicio
    const dur = durationDaysFor(membresias, idMembresia);
    if (dur) {
      setFechaFin(addDaysStr(fechaInicio, dur));
      setTouchedFin(false);
    } else {
      setFechaFin(addMonthsStr(fechaInicio, 1));
      setTouchedFin(false);
    }
  }, [idMembresia, membresias]); // eslint-disable-line react-hooks/exhaustive-deps

  // Asignar stream a video cuando camOn = true
  useEffect(() => {
    if (!camOn) return;
    const v = videoRef.current;
    const stream = mediaStreamRef.current;
    if (!v || !stream) return;
    (v as any).srcObject = stream;
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
    if (videoRef.current) (videoRef.current as any).srcObject = null;
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
    const di = parseDateOnlyLocal(fechaInicio);
    const df = parseDateOnlyLocal(fechaFin);
    if (!di || !df) return false;
    di.setHours(0, 0, 0, 0);
    df.setHours(0, 0, 0, 0);
    return di.getTime() > df.getTime();
  }, [fechaInicio, fechaFin]);

  const precioInvalid = useMemo(() => {
    if (precioFinal.trim() === "") return false;
    const n = Number(precioFinal);
    return Number.isNaN(n) || n < 0;
  }, [precioFinal]);



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

      if (fotoBase64) {
        const ruta = await uploadBase64ToBackend(
          documento.trim(),
          fotoBase64,
          "image/jpeg"
        );
        fotografiaRuta = ruta;
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
          id_tipo_descuento: 1,
          huella_base64: "",
          observaciones: observaciones.trim() || undefined,
        },
        venta: {
          id_membresia: Number(idMembresia),
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
          precio_final:
            precioFinal.trim() === "" ? undefined : Number(precioFinal),
          sesiones_restantes:
            sesionesRestantes.trim() === ""
              ? undefined
              : Number(sesionesRestantes),
          estado: "activa" as EstadoMembresia,
        },
      };

      const res = await createClienteConMembresia(payload);
      const clienteId = res.data?.cliente?.id;

      if (clienteId) {
        navigate(`/HuellaController/${clienteId}`);
      } else {
        navigate("/clientes/membresias");
      }

    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.detail || e?.message || "Error al guardar.";
      setError(String(msg));
      MySwal.fire({
        icon: "error",
        title: "¡Error al guardar!",
        text: "Error al crear",
        confirmButtonColor: "#d63030ff",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 transition-all duration-300 ease-in-out">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-yellow-400/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h5 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Icon icon="solar:user-plus-rounded-bold-duotone" className="text-primary" />
              Nuevo Cliente
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Registra la información personal y asigna una membresía inicial.
            </p>
          </div>
          <Link
            to="/clientes/membresias"
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Icon icon="solar:arrow-left-linear" width={18} />
            <span>Volver al listado</span>
          </Link>
        </div>

        {error && (
          <div className="mb-4 text-sm rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-center gap-2">
            <Icon icon="solar:danger-circle-bold" className="text-lg" />
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 text-sm rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" className="text-lg" />
            {info}
          </div>
        )}

        {(() => {
          const inputClass = "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all p-2.5 text-sm outline-none";
          const labelClass = "block mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400";

          return (
            <>
              {loadingCat ? (
                <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <Spinner size="xl" color="warning" />
                  <span className="mt-4 text-gray-500 animate-pulse">Cargando catálogo de membresías...</span>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Columna Izquierda: Datos Personales + Foto */}
                  <div className="lg:col-span-7 space-y-6">

                    {/* Tarjeta: Información Personal */}
                    <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex items-center gap-2">
                        <Icon icon="solar:user-id-linear" className="text-primary" width={20} />
                        <h6 className="font-semibold text-gray-800 dark:text-white">Información Personal</h6>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="nombre" className={labelClass}>Nombre *</label>
                          <input id="nombre" type="text" className={inputClass} placeholder="Ej: Juan" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                        </div>
                        <div>
                          <label htmlFor="apellido" className={labelClass}>Apellido *</label>
                          <input id="apellido" type="text" className={inputClass} placeholder="Ej: Pérez" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="documento" className={labelClass}>Documento de Identidad *</label>
                          <input id="documento" type="text" className={inputClass} placeholder="Ej: 1234567890" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
                        </div>
                        <div>
                          <label htmlFor="fecha_nacimiento" className={labelClass}>Fecha de Nacimiento</label>
                          <input id="fecha_nacimiento" type="date" className={inputClass} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
                        </div>
                        <div>
                          <label htmlFor="telefono" className={labelClass}>Teléfono</label>
                          <input id="telefono" type="text" className={inputClass} placeholder="Ej: 300 123 4567" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="correo" className={labelClass}>Correo Electrónico</label>
                          <input id="correo" type="email" className={inputClass} placeholder="cliente@email.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="direccion" className={labelClass}>Dirección</label>
                          <input id="direccion" type="text" className={inputClass} placeholder="Dirección de residencia" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="observaciones" className={labelClass}>Observaciones</label>
                          <textarea id="observaciones" className={inputClass} placeholder="Notas adicionales..." rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta: Fotografía */}
                    <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex items-center gap-2">
                        <Icon icon="solar:camera-linear" className="text-primary" width={20} />
                        <h6 className="font-semibold text-gray-800 dark:text-white">Fotografía</h6>
                      </div>
                      <div className="p-6">
                        {!fotoBase64 && !camOn && (
                          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 transition-colors">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-3">
                              <Icon icon="solar:camera-add-linear" width={32} className="text-gray-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Agregar Foto</h3>
                            <p className="text-xs text-gray-500 mb-4">Usa la cámara web para capturar</p>
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg shadow-lg shadow-primary/30 hover:brightness-110 transition-all flex items-center gap-2"
                            >
                              <Icon icon="solar:camera-minimalistic-bold" width={18} /> Iniciar Cámara
                            </button>
                            {camError && <span className="text-red-500 text-xs mt-2 font-medium">{camError}</span>}
                          </div>
                        )}

                        {camOn && (
                          <div className="flex flex-col items-center gap-4 animate-fade-in">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-primary/20 max-w-sm w-full bg-black">
                              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover transform scale-x-[-1]" />
                              <canvas ref={canvasRef} className="hidden" />

                              {/* Camera Overlay */}
                              <div className="absolute inset-0 border-[3px] border-white/30 rounded-2xl pointer-events-none"></div>
                              <div className="absolute top-4 right-4 flex gap-2">
                                <span className="px-2 py-0.5 bg-red-500/80 text-white text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">REC</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button type="button" onClick={stopCamera} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                <Icon icon="solar:close-circle-bold" width={22} />
                              </button>
                              <button
                                type="button"
                                onClick={takePhoto}
                                disabled={!videoReady}
                                className="h-12 w-12 rounded-full border-4 border-white shadow-xl bg-primary flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
                              >
                                <Icon icon="solar:camera-minimalistic-bold" width={24} />
                              </button>
                            </div>
                          </div>
                        )}

                        {fotoBase64 && !camOn && (
                          <div className="flex items-center gap-6 animate-fade-in">
                            <div className="relative group">
                              <img src={`data:image/jpeg;base64,${fotoBase64}`} alt="Foto cliente" className="w-32 h-32 object-cover rounded-2xl shadow-lg ring-4 ring-gray-100 dark:ring-gray-700" />
                              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                                <Icon icon="solar:check-circle-bold" width={16} />
                              </div>
                              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={clearPhoto} type="button" className="text-white bg-red-500/80 p-2 rounded-full hover:bg-red-600 transition-colors">
                                  <Icon icon="solar:trash-bin-trash-bold" width={20} />
                                </button>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">Foto capturada</h5>
                              <p className="text-xs text-gray-500 mb-2">Se ve bien. Si quieres cambiarla, usa el botón sobre la imagen.</p>
                              <button type="button" onClick={clearPhoto} className="text-xs text-red-500 font-medium hover:underline">Eliminar y tomar nueva</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Membresía + Acciones */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border-2 border-primary/20 overflow-hidden relative">
                      {/* Highlight Top */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-yellow-400"></div>

                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Icon icon="solar:bill-list-bold-duotone" width={22} />
                          </div>
                          <div>
                            <h6 className="font-bold text-gray-800 dark:text-white text-lg">Membresía</h6>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Configuración de venta</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <label htmlFor="id_membresia" className={labelClass}>Seleccionar Plan *</label>
                            <select
                              id="id_membresia"
                              className={inputClass}
                              value={idMembresia}
                              onChange={(e) => {
                                // (Lógica existente preservada)
                                const newId = e.target.value ? Number(e.target.value) : "";
                                setIdMembresia(newId);
                                const defSessions = defaultSessionsFor(membresias, newId);
                                if (defSessions != null && Number.isFinite(defSessions)) setSesionesRestantes(String(defSessions));
                                const m = membresias.find((x) => x.id === Number(newId));
                                const { precio } = extractPrecioYSesiones(m);
                                if (precio != null && Number.isFinite(precio)) setPrecioFinal(String(precio));
                                const dur = durationDaysFor(membresias, newId);
                                if (dur) {
                                  setFechaFin(addDaysStr(fechaInicio, dur));
                                  setTouchedFin(false);
                                } else {
                                  setFechaFin(addMonthsStr(fechaInicio, 1));
                                  setTouchedFin(false);
                                }
                              }}
                              required
                            >
                              <option value="">-- Seleccionar --</option>
                              {membresias.map((m) => (
                                <option key={m.id} value={m.id}> {m.nombre_membresia} </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="fecha_inicio" className={labelClass}>Inicio</label>
                              <input id="fecha_inicio" type="date" className={`${inputClass} ${dateInvalid ? 'border-red-500 text-red-600' : ''}`} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                            </div>
                            <div>
                              <label htmlFor="fecha_fin" className={labelClass}>Fin</label>
                              <input id="fecha_fin" type="date" className={`${inputClass} ${dateInvalid ? 'border-red-500 text-red-600' : ''}`} value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setTouchedFin(true); }} />
                            </div>
                          </div>
                          {dateInvalid && <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">⚠ La fecha de fin no puede ser anterior al inicio.</p>}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="precio_final" className={labelClass}>Precio (COP)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                                <input id="precio_final" type="number" step="0.01" className={`${inputClass} pl-6`} placeholder="0" value={precioFinal} onChange={(e) => setPrecioFinal(e.target.value)} />
                              </div>
                            </div>
                            <div>
                              <label htmlFor="sesiones" className={labelClass}>Sesiones</label>
                              <input id="sesiones" type="number" step="1" className={inputClass} placeholder="∞" value={sesionesRestantes} onChange={(e) => setSesionesRestantes(e.target.value)} />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-500">Estado Inicial</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase">Activa</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-500">Total a Pagar</span>
                              <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {precioFinal ? Number(precioFinal).toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '$ 0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="space-y-3 pt-2">
                      <button
                        type="submit"
                        disabled={saving || dateInvalid || precioInvalid}
                        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg
                                      bg-gradient-to-r from-primary to-yellow-500 text-white shadow-lg shadow-yellow-500/30
                                      hover:translate-y-[-2px] hover:shadow-yellow-500/50 active:translate-y-[0px] transition-all
                                      disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <> <Spinner size="sm" color="white" /> Registrando... </>
                        ) : (
                          <> <Icon icon="solar:check-circle-bold" width={24} /> Registrar Cliente </>
                        )}
                      </button>

                      <Link
                        to="/clientes/membresias"
                        className="block w-full text-center py-3 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                      >
                        Cancelar operación
                      </Link>
                    </div>
                  </div>

                </form>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

