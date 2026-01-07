// src/pages/Clientes/EditarClienteConMembresia.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Spinner } from "flowbite-react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { getCliente, Cliente } from "../../../api/clientes";
import { getVentasMembresia, VentaMembresia } from "../../../api/venta_membresia";
import { getMembresias } from "../../../api/membresias";
import {
  updateClienteConMembresia,
  ActualizarClienteYVentaRequest,
} from "../../../api/clientes_membresia";
import { API_BASE_URL } from "../../../api/apiConfig";

/* ===================== Helpers fecha ===================== */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// formatea Date a "YYYY-MM-DD" en local
function fmtDateInputLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// parsea "YYYY-MM-DD" como LOCAL (evita -1 día por UTC)
function parseDateOnlyLocal(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }
  const d = new Date(s!);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addMonthsStr(isoDate: string, months: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const base = new Date(y, m - 1, d); // local
  base.setMonth(base.getMonth() + months);
  return fmtDateInputLocal(base);
}

// suma días completos en local
function addDaysStr(isoDate: string, days: number) {
  const d0 = parseDateOnlyLocal(isoDate);
  if (!d0) return isoDate;
  const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
  d.setDate(d.getDate() + days);
  return fmtDateInputLocal(d);
}

/* ===================== Foto: config/helpers ===================== */
const API_BASE = API_BASE_URL;
const API_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, "");

function resolveFotoSrc(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return API_ORIGIN + src;
  if (src.startsWith("media/")) return `${API_ORIGIN}/${src}`;
  return `data:image/jpeg;base64,${src}`;
}

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
  return data.ruta as string;
}

/* ===================== Tipos & utils membresía ===================== */
type Membresia = {
  id: number;
  nombre_membresia: string;
  precio?: number;
  precio_base?: number;
  valor?: number;
  cantidad_sesiones?: number;

  // posibles nombres para la duración en días
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
function sortVentasDesc(ventas: VentaMembresia[]) {
  return [...ventas].sort((a, b) => {
    const da = parseDateOnlyLocal(a.fecha_inicio as any)?.getTime() ?? 0;
    const db = parseDateOnlyLocal(b.fecha_inicio as any)?.getTime() ?? 0;
    return db - da;
  });
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

/** Calcula fecha fin según días de la membresía; fallback +1 mes */
function calcFechaFinPorMembresia(
  inicioISO: string,
  membresias: Membresia[],
  idMembresia: number | ""
) {
  const dur = durationDaysFor(membresias, idMembresia);
  // Usa (dur - 1) si deseas inclusivo (ej. del 01 al 30 con 30 días)
  if (dur && dur > 0) return addDaysStr(inicioISO, dur);
  return addMonthsStr(inicioISO, 1);
}

/* ===================== Componente ===================== */
export default function EditarClienteConMembresia() {
  const MySwal = withReactContent(Swal);
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);
  const navigate = useNavigate();

  /* Catálogos / UI */
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  /* Cliente */
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<string>("");

  /* Foto */
  const [fotoRutaActual, setFotoRutaActual] = useState<string | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);
  const [fotoBase64Nueva, setFotoBase64Nueva] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [borrarFoto, setBorrarFoto] = useState(false);

  // Drag & Drop
  const [dragActive, setDragActive] = useState(false);
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(true);
  };
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
  };
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      setError("Solo se permiten imágenes JPG o PNG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const [, b64] = dataUrl.split(",");
      if (!b64) return;
      setFotoMime(file.type === "image/png" ? "image/png" : "image/jpeg");
      setFotoBase64Nueva(b64);
      setFotoPreviewUrl(dataUrl);
      setBorrarFoto(false);
    };
    reader.readAsDataURL(file);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onPickFile = () => fileInputRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      setError("Solo se permiten imágenes JPG o PNG.");
      e.currentTarget.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const [, b64] = dataUrl.split(",");
      if (!b64) return;
      setFotoMime(file.type === "image/png" ? "image/png" : "image/jpeg");
      setFotoBase64Nueva(b64);
      setFotoPreviewUrl(dataUrl);
      setBorrarFoto(false);
    };
    reader.readAsDataURL(file);
  };
  const clearNewPhoto = () => {
    setFotoBase64Nueva(null);
    setFotoPreviewUrl(null);
  };

  /* Cámara */
  const [camError, setCamError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => () => mediaStreamRef.current?.getTracks().forEach((t) => t.stop()), []);
  const startCamera = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
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
    c.width = w; c.height = h;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    const b64 = dataUrl.split(",")[1] || "";
    setFotoMime("image/jpeg");
    setFotoBase64Nueva(b64);
    setFotoPreviewUrl(`data:image/jpeg;base64,${b64}`);
    setBorrarFoto(false);
    stopCamera();
  };

  /* Venta (última) */
  const [ventaId, setVentaId] = useState<number | undefined>(undefined);
  const [idMembresia, setIdMembresia] = useState<number | "">("");
  const [fechaInicio, setFechaInicio] = useState<string>(todayStr());
  const [fechaFin, setFechaFin] = useState<string>(() => addMonthsStr(todayStr(), 1));
  const [touchedFin, setTouchedFin] = useState(false);
  const [precioFinal, setPrecioFinal] = useState<string>("");
  const [sesionesRestantes, setSesionesRestantes] = useState<string>("");


  // Flags
  const [userChangedMembresia, setUserChangedMembresia] = useState(false);

  /* ===== Carga de datos (reutilizable) ===== */
  const loadData = async (idCli: number) => {
    setLoading(true);
    setError(null);
    try {
      const [cliRes, ventasRes, membRes] = await Promise.all([
        getCliente(idCli),
        getVentasMembresia(),
        getMembresias(),
      ]);

      // Cliente
      const c = cliRes.data as Cliente;
      setCliente(c);
      setNombre(c.nombre ?? "");
      setApellido(c.apellido ?? "");
      setDocumento(c.documento ?? "");
      setCorreo(c.correo ?? "");
      setTelefono(c.telefono ?? "");
      setDireccion(c.direccion ?? "");
      setObservaciones((c as any).observaciones ?? "");
      if (c.fecha_nacimiento) {
        const d = parseDateOnlyLocal(c.fecha_nacimiento);
        if (d) setFechaNacimiento(fmtDateInputLocal(d));
      }
      const fotoDb = (c as any).fotografia || (c as any).foto || null;
      setFotoRutaActual(fotoDb);

      // Ventas
      const ventas = (Array.isArray(ventasRes.data)
        ? ventasRes.data
        : (ventasRes.data as any)?.data ?? []) as any[];
      const ventasCliente = sortVentasDesc(ventas.filter((v) => v.id_cliente === idCli));
      const last = ventasCliente[0] ?? null;

      if (last) {
        setVentaId(last.id);
        if (last.fecha_inicio) {
          const di = parseDateOnlyLocal(last.fecha_inicio);
          if (di) setFechaInicio(fmtDateInputLocal(di));
        }
        if (last.fecha_fin) {
          const df = parseDateOnlyLocal(last.fecha_fin);
          if (df) {
            setFechaFin(fmtDateInputLocal(df));
            setTouchedFin(true); // ✅ respeta la fecha del backend
          }
        }
        setPrecioFinal(last.precio_final != null ? String(last.precio_final) : "");
        setSesionesRestantes(
          last.sesiones_restantes != null ? String(last.sesiones_restantes) : ""
        );
        setIdMembresia(last.id_membresia ?? "");
        setUserChangedMembresia(false);
      }

      // Membresías
      const membs = (Array.isArray(membRes.data)
        ? membRes.data
        : (membRes.data as any)?.data ?? []) as Membresia[];
      setMembresias(membs);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    loadData(clienteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  // Autocalcular fecha_fin cuando cambia fecha_inicio o membresía,
  // SOLO si el usuario no la ha tocado manualmente y si no venía del backend marcada.
  useEffect(() => {
    if (touchedFin) return;
    const nuevoFin = calcFechaFinPorMembresia(fechaInicio, membresias, idMembresia);
    setFechaFin(nuevoFin);
  }, [fechaInicio, idMembresia, membresias, touchedFin]);

  // Autocompletar precio SOLO si el usuario cambia la membresía
  useEffect(() => {
    if (idMembresia === "" || !userChangedMembresia) return;
    const m = membresias.find((x) => x.id === Number(idMembresia));
    const { precio } = extractPrecioYSesiones(m);
    if (precio != null && Number.isFinite(precio)) setPrecioFinal(String(precio));
  }, [idMembresia, membresias, userChangedMembresia]);

  /* ===================== Validaciones ===================== */
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



  /* ===================== Submit ===================== */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (dateInvalid) { setError("La fecha de fin no puede ser anterior a la fecha de inicio."); return; }
    if (precioInvalid) { setError("El precio debe ser un número mayor o igual a 0."); return; }
    if (!nombre.trim() || !apellido.trim() || !documento.trim()) {
      setError("Nombre, apellido y documento son obligatorios."); return;
    }
    if (idMembresia === "") { setError("Selecciona una membresía."); return; }
    if (ventaId === undefined) { setError("No se encontró la venta a actualizar."); return; }

    setSaving(true);
    try {
      // 1) Subir nueva foto si existe
      let fotografiaRuta: string | undefined = undefined;
      if (fotoBase64Nueva) {
        const ruta = await uploadBase64ToBackend(documento.trim(), fotoBase64Nueva, fotoMime);
        fotografiaRuta = ruta;
        setFotoRutaActual(ruta);
        setInfo("Foto actualizada.");
      }

      // 2) Construir payload
      const clientePayload: any = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        documento: documento.trim(),
        ...(fechaNacimiento ? { fecha_nacimiento: fechaNacimiento } : {}),
        correo: correo.trim() || undefined,
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
        huella_base64: "",
        observaciones: observaciones.trim() || undefined,
      };

      if (borrarFoto && !fotografiaRuta) clientePayload.fotografia = "";
      if (fotografiaRuta) clientePayload.fotografia = fotografiaRuta;

      const payload: ActualizarClienteYVentaRequest = {
        cliente: clientePayload,
        venta: {
          id: ventaId,
          id_cliente: clienteId, // usar id del path
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
      await MySwal.fire({
        icon: "success",
        title: "¡Guardado!",
        text: "Cambio guardado correctamente",
        confirmButtonColor: "#d2dd04ff",
      });

      // permanecer en la misma pantalla y refrescar datos
      await loadData(clienteId);
      // volvemos a permitir auto-cálculo SOLO si el usuario cambia algo luego
      setUserChangedMembresia(false);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.detail || e?.message || "Error al guardar.";
      setError(String(msg));
      MySwal.fire({
        icon: "error",
        title: "¡Error al Guardar!",
        text: "Error al guardar cambios",
        confirmButtonColor: "#dd0404ff",
      });
    } finally {
      setSaving(false);
    }
  };

  const titulo = useMemo(
    () => (cliente ? `Editar: ${cliente.nombre} ${cliente.apellido}` : "Editar cliente"),
    [cliente]
  );

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
              <Icon icon="solar:user-id-bold-duotone" className="text-primary" />
              {titulo}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Actualiza la información personal, fotografía y detalles de la membresía.
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
              {loading ? (
                <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <Spinner size="xl" color="warning" />
                  <span className="mt-4 text-gray-500 animate-pulse">Cargando datos del cliente...</span>
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

                        {/* Visualización de Foto Actual/Preview */}
                        <div className="flex flex-col sm:flex-row gap-6 mb-6">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Foto Actual</span>
                            {fotoRutaActual ? (
                              <div className="relative group">
                                <img
                                  src={resolveFotoSrc(fotoRutaActual)!}
                                  alt="Foto actual"
                                  className={`w-32 h-32 object-cover rounded-2xl shadow-md border-2 border-gray-200 dark:border-gray-600 ${borrarFoto ? 'opacity-50 grayscale' : ''}`}
                                />
                                {borrarFoto && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-red-500/80 text-white text-xs font-bold px-2 py-1 rounded">ELIMINAR</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <Icon icon="solar:user-circle-linear" width={40} className="text-gray-400" />
                              </div>
                            )}
                            {fotoRutaActual && (
                              <label className="mt-3 inline-flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                  <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={borrarFoto}
                                    onChange={(e) => { setBorrarFoto(e.target.checked); if (e.target.checked) clearNewPhoto(); }}
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
                                </div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-red-500 transition-colors">Eliminar foto</span>
                              </label>
                            )}
                          </div>

                          {fotoPreviewUrl && (
                            <div className="flex flex-col items-center animate-fade-in">
                              <span className="text-xs font-bold uppercase tracking-wider text-green-500 mb-2">Nueva Foto</span>
                              <div className="relative">
                                <img src={fotoPreviewUrl} alt="Nueva foto" className="w-32 h-32 object-cover rounded-2xl shadow-lg ring-4 ring-green-500/20" />
                                <button
                                  type="button"
                                  onClick={clearNewPhoto}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                  title="Descartar nueva foto"
                                >
                                  <Icon icon="solar:close-circle-bold" width={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div
                          onDragOver={onDragOver}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop}
                          className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${dragActive ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-600 hover:border-primary/50"}`}
                        >
                          {!camOn ? (
                            <div className="flex flex-col items-center">
                              <div className="flex flex-wrap justify-center gap-3 mb-4">
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white font-medium rounded-lg shadow hover:bg-black dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                                >
                                  <Icon icon="solar:camera-minimalistic-bold" width={18} /> Cámara
                                </button>
                                <button
                                  type="button"
                                  onClick={onPickFile}
                                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                  <Icon icon="solar:upload-minimalistic-linear" width={18} /> Subir archivo
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onFileChange} />
                              </div>
                              <p className="text-xs text-gray-500 text-center">
                                Arrastra una imagen aquí (JPG, PNG) o usa los botones.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center animate-fade-in w-full">
                              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-primary/20 max-w-sm w-full bg-black mb-4">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
                                <canvas ref={canvasRef} className="hidden" />
                              </div>
                              <div className="flex items-center gap-3">
                                <button type="button" onClick={takePhoto} disabled={!videoReady} className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg shadow-lg hover:brightness-110 flex items-center gap-2">
                                  <Icon icon="solar:camera-bold" width={18} /> Capturar
                                </button>
                                <button type="button" onClick={stopCamera} className="px-5 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 flex items-center gap-2">
                                  Cancelar
                                </button>
                              </div>
                              {camError && <span className="text-red-500 text-xs mt-2 font-medium">{camError}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Membresía + Acciones */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border-2 border-primary/20 overflow-hidden relative">
                      {/* Highlight Top - Purple if Edit mode */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Icon icon="solar:card-reciept-bold-duotone" width={22} />
                          </div>
                          <div>
                            <h6 className="font-bold text-gray-800 dark:text-white text-lg">Membresía</h6>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Editar plan actual</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <label htmlFor="id_membresia" className={labelClass}>Plan *</label>
                            <select
                              id="id_membresia"
                              className={inputClass}
                              value={idMembresia}
                              onChange={(e) => {
                                // (Lógica existente preservada)
                                const newId = e.target.value ? Number(e.target.value) : "";
                                setIdMembresia(newId);
                                setUserChangedMembresia(true);
                                const defSessions = defaultSessionsFor(membresias, newId);
                                if (defSessions != null && Number.isFinite(defSessions)) setSesionesRestantes(String(defSessions));
                                setTouchedFin(false);
                                const nuevoFin = calcFechaFinPorMembresia(fechaInicio, membresias, newId);
                                setFechaFin(nuevoFin);
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
                              <input id="fecha_inicio" type="date" className={`${inputClass} ${dateInvalid ? 'border-red-500 text-red-600' : ''}`} value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setTouchedFin(false); }} />
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
                              <span className="text-sm font-medium text-gray-500">Estado</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">Activo</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-500">Valor</span>
                              <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {precioFinal ? Number(precioFinal).toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '$ 0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="space-y-4 pt-2">
                      <button
                        type="submit"
                        disabled={saving || dateInvalid || precioInvalid}
                        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg
                                      bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30
                                      hover:translate-y-[-2px] hover:shadow-indigo-500/50 active:translate-y-[0px] transition-all
                                      disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <> <Spinner size="sm" color="white" /> Guardando... </>
                        ) : (
                          <> <Icon icon="solar:floppy-disk-bold" width={24} /> Guardar Cambios </>
                        )}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/HuellaController/${clienteId}`)}
                          className="px-4 py-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 text-yellow-700 font-bold hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon icon="solar:hand-stars-bold" width={20} />
                          Editar Huella
                        </button>
                        <Link
                          to="/clientes/membresias"
                          className="px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                          Cancelar
                        </Link>
                      </div>
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
