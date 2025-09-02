// src/pages/Clientes/EditarClienteConMembresia.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button, Spinner } from "flowbite-react";
import { Icon } from "@iconify/react";

import { getCliente, Cliente } from "../../../api/clientes";
import { getVentasMembresia, VentaMembresia } from "../../../api/venta_membresia";
import { getMembresias } from "../../../api/membresias";
import {
  updateClienteConMembresia,
  ActualizarClienteYVentaRequest,
  EstadoMembresia,
} from "../../../api/clientes_membresia";
import { API_BASE_URL } from "../../../api/apiConfig";

/* ===================== Helpers fecha ===================== */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addMonthsStr(isoDate: string, months: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const base = new Date(y, m - 1, d); // ya es local
  base.setMonth(base.getMonth() + months);
  return fmtDateInputLocal(base); // ⬅️ en vez de concatenar manual
}

// ✅ parsea "YYYY-MM-DD" como medianoche LOCAL (sin desfase)
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

// ✅ formatea Date a "YYYY-MM-DD" en local (para inputs <type="date">)
function fmtDateInputLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  const res = await fetch(`${API_BASE}/uploads/files/upload-foto`, { method: "POST", body: fd });
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

/* ===================== Componente ===================== */
export default function EditarClienteConMembresia() {
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
  const [fechaNacimiento, setFechaNacimiento] = useState<string>("");

  /* Foto */
  const [fotoRutaActual, setFotoRutaActual] = useState<string | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null); // preview nueva
  const [fotoBase64Nueva, setFotoBase64Nueva] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [borrarFoto, setBorrarFoto] = useState(false); // para limpiar en backend (enviando "")

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
      setBorrarFoto(false); // si carga nueva, no borrar
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
    if (videoRef.current) videoRef.current.srcObject = null;
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
  const [touchedFin, setTouchedFin] = useState(false); // 👈 evita sobreescribir si el usuario la cambió
  const [precioFinal, setPrecioFinal] = useState<string>("");
  const [sesionesRestantes, setSesionesRestantes] = useState<string>("");
  const estado: EstadoMembresia = "activa";

  /* ===== Cargar datos ===== */
   /* useEffect(() => {
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
        if ((c as any).fecha_nacimiento) {
          const d = new Date((c as any).fecha_nacimiento as any);
          if (!Number.isNaN(d.getTime())) {
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            setFechaNacimiento(iso);
          }
        }
        const fotoDb = (c as any).fotografia || (c as any).foto || null;
        setFotoRutaActual(fotoDb || null);

        const ventas = Array.isArray(ventasRes.data) ? ventasRes.data : ventasRes.data?.data || [];
        const ventasCliente = sortVentasDesc(ventas.filter((v: any) => v.id_cliente === clienteId));
        const last = ventasCliente[0] || null;

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

    return () => { mounted = false; };
  }, [clienteId]);
*/

  // inicio use efec
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([getCliente(clienteId), getVentasMembresia(), getMembresias()])
      .then(([cliRes, ventasRes, membRes]) => {
        if (!mounted) return;

        // ----- Cliente -----
        const c = cliRes.data as Cliente;
        setCliente(c);
        setNombre(c.nombre ?? "");
        setApellido(c.apellido ?? "");
        setDocumento(c.documento ?? "");
        setCorreo(c.correo ?? "");
        setTelefono(c.telefono ?? "");
        setDireccion(c.direccion ?? "");

        // Fecha nacimiento
        if (c.fecha_nacimiento) {
          const d = parseDateOnlyLocal(c.fecha_nacimiento);
          if (d) setFechaNacimiento(fmtDateInputLocal(d));
        }

        // Foto
        const fotoDb = (c as any).fotografia || (c as any).foto || null;
        setFotoRutaActual(fotoDb);

        // ----- Ventas -----
        const ventas = (Array.isArray(ventasRes.data)
          ? ventasRes.data
          : (ventasRes.data as any)?.data ?? []) as any[];

        const ventasCliente = sortVentasDesc(
          ventas.filter((v) => v.id_cliente === clienteId)
        );
        const last = ventasCliente[0] ?? null;

        if (last) {
          setVentaId(last.id);
          setIdMembresia(last.id_membresia ?? "");

          if (last.fecha_inicio) {
            const di = parseDateOnlyLocal(last.fecha_inicio);
            if (di) setFechaInicio(fmtDateInputLocal(di));
          }
          if (last.fecha_fin) {
            const df = parseDateOnlyLocal(last.fecha_fin);
            if (df) setFechaFin(fmtDateInputLocal(df));
          }

          setPrecioFinal(last.precio_final != null ? String(last.precio_final) : "");
          setSesionesRestantes(
            last.sesiones_restantes != null ? String(last.sesiones_restantes) : ""
          );
        }

        // ----- Membresías -----
        const membs = (Array.isArray(membRes.data)
          ? membRes.data
          : (membRes.data as any)?.data ?? []) as Membresia[];

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

  useEffect(() => {
    if (!touchedFin) setFechaFin(addMonthsStr(fechaInicio, 1));
  }, [fechaInicio, touchedFin]);

  // Autocompletar precio/sesiones al cambiar membresía
  useEffect(() => {
    if (idMembresia === "") return;
    const m = membresias.find((x) => x.id === Number(idMembresia));
    const { precio, sesiones } = extractPrecioYSesiones(m);
    if (precio != null && Number.isFinite(precio)) setPrecioFinal(String(precio));
    if (sesiones != null && Number.isFinite(sesiones)) setSesionesRestantes(String(sesiones));
  }, [idMembresia, membresias]);

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

  /* ===================== Inputs estilo template ===================== */
  const baseInput =
    "block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 " +
    "focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white " +
    "dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg";

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
      };

      // si pidió borrar foto y no subió nueva -> envia string vacío
      if (borrarFoto && !fotografiaRuta) clientePayload.fotografia = "";
      // si subió nueva -> ruta nueva
      if (fotografiaRuta) clientePayload.fotografia = fotografiaRuta;

      if (ventaId === undefined) {
      throw new Error("ventaId es obligatorio para actualizar la venta");
      }

      const payload: ActualizarClienteYVentaRequest = {
        cliente: clientePayload,
        venta: {
          id: ventaId,
          id_cliente: clientePayload.id,
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
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <h5 className="card-title">{titulo}</h5>
        <Link
          to="/clientes/membresias"
          role="button"
          className="flex items-center justify-center px-4 py-3 gap-3 text-[15px]
                     leading-[normal] font-medium text-black
                     bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                     rounded-xl shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                     hover:brightness-[1.03] hover:-translate-y-[1px] active:translate-y-0 transition-all
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-start,#FFD54A)]/60 focus:ring-offset-2"
        >
          <Icon icon="solar:alt-arrow-left-outline" width="18" height="18" />
          <span>Volver</span>
        </Link>
      </header>

      {/* Mensajes */}
      {error && (
        <div className="mb-3 text-sm rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2">{error}</div>
      )}
      {info && (
        <div className="mb-3 text-sm rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2">{info}</div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center gap-2">
          <Spinner /> <span>Cargando…</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Datos del cliente */}
          <section>
            <h6 className="font-semibold mb-3">Datos del cliente</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="nombre" className="sr-only">Nombre</label>
                  <input id="nombre" type="text" className={baseInput} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
              </div>
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="apellido" className="sr-only">Apellido</label>
                  <input id="apellido" type="text" className={baseInput} placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                </div>
              </div>
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="documento" className="sr-only">Documento</label>
                  <input id="documento" type="text" className={baseInput} placeholder="Documento" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
                </div>
              </div>

              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="fecha_nacimiento" className="sr-only">Fecha de nacimiento</label>
                  <input 
                    id="fecha_nacimiento" 
                    type="date" 
                    className={baseInput} 
                    value={fechaNacimiento} 
                    onChange={(e) => {
                      const d = parseDateOnlyLocal(e.target.value);
                      setFechaNacimiento(d ? fmtDateInputLocal(d) : e.target.value);
                    }}
                  />
                </div>
              </div>
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="correo" className="sr-only">Correo</label>
                  <input id="correo" type="email" className={baseInput} placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
                </div>
              </div>
              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="telefono" className="sr-only">Teléfono</label>
                  <input id="telefono" type="text" className={baseInput} placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </div>
              </div>
              <div className="flex form-control form-rounded-xl md:col-span-3">
                <div className="relative w-full">
                  <label htmlFor="direccion" className="sr-only">Dirección</label>
                  <input id="direccion" type="text" className={baseInput} placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          {/* Fotografía */}
          <section>
            <h6 className="font-semibold mb-3">Fotografía</h6>

            {/* Tarjetas actual / nueva */}
            <div className="flex items-start gap-6 mb-4">
              <div className="flex flex-col items-start">
                <span className="text-xs mb-1 opacity-70">Actual</span>
                {fotoRutaActual ? (
                  <img
                    src={resolveFotoSrc(fotoRutaActual)!}
                    alt="foto actual"
                    className="h-32 w-32 object-cover rounded-xl border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml;utf8," +
                        encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' rx='16' fill='#2d333b'/></svg>`);
                    }}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-xl border bg-gray-100 dark:bg-gray-800" />
                )}
                <label className="mt-2 inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-cyan-500"
                    checked={borrarFoto}
                    onChange={(e) => { setBorrarFoto(e.target.checked); if (e.target.checked) clearNewPhoto(); }}
                  />
                  Borrar foto actual
                </label>
              </div>

              {fotoPreviewUrl && (
                <div className="flex flex-col items-start">
                  <span className="text-xs mb-1 opacity-70">Nueva</span>
                  <img src={fotoPreviewUrl} alt="nueva" className="h-32 w-32 object-cover rounded-xl border" />
                </div>
              )}
            </div>

            {/* Zona de drop + botones */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-4 transition ${dragActive ? "border-primary bg-lightprimary/30" : "border-gray-300 dark:border-gray-600"}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                {!camOn ? (
                  <>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <Icon icon="solar:camera-outline" width="18" height="18" />
                      Abrir cámara
                    </button>

                    <button
                      type="button"
                      onClick={onPickFile}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <Icon icon="solar:upload-linear" width="18" height="18" />
                      Subir archivo
                    </button>

                    {fotoPreviewUrl && (
                      <button
                        type="button"
                        onClick={clearNewPhoto}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        <Icon icon="solar:close-circle-outline" width="18" height="18" />
                        Quitar nueva foto
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={onFileChange}
                    />

                    <span className="text-xs opacity-70">
                      Arrastra una imagen aquí o usa los botones. (JPG o PNG)
                    </span>
                  </>
                ) : (
                  <div className="w-full">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-md rounded-xl border aspect-video bg-black" />
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={takePhoto}
                        disabled={!videoReady}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white shadow-btnshdw hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Icon icon="solar:camera-add-outline" width="18" height="18" />
                        Tomar foto
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        <Icon icon="solar:close-circle-outline" width="18" height="18" />
                        Cancelar
                      </button>
                    </div>
                    {camError && <span className="text-red-600 text-sm mt-2 inline-block">{camError}</span>}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs opacity-70 mt-2">La foto se guardará al presionar <strong>Guardar</strong>.</p>
          </section>

          {/* Membresía / Venta */}
          <section>
            <h6 className="font-semibold mb-3">Membresía</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <option key={m.id} value={m.id}>{m.nombre_membresia}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex form-control form-rounded-xl">
                <div className="relative w-full">
                  <label htmlFor="fecha_inicio" className="sr-only">Fecha inicio</label>
                  <input
                    id="fecha_inicio"
                    type="date"
                    className={`${baseInput} ${dateInvalid ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    aria-invalid={dateInvalid || undefined}
                    value={fechaInicio}
                    onChange={(e) => {
                      const d = parseDateOnlyLocal(e.target.value);
                      setFechaInicio(d ? fmtDateInputLocal(d) : e.target.value);
                      // touchedFin no cambia aquí
                    }}
                  />
                </div>
              </div>

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
                      const d = parseDateOnlyLocal(e.target.value);
                      setFechaFin(d ? fmtDateInputLocal(d) : e.target.value);
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
                  {precioInvalid && <p className="mt-1 text-xs text-red-600">El precio debe ser mayor o igual a 0.</p>}
                </div>
              </div>

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
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-black
                         bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                         shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                         hover:brightness-[1.03] disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-start,#FFD54A)]/60 focus:ring-offset-2"
            >
              {saving ? (
                <>
                  <Spinner size="sm" /> Guardando…
                </>
              ) : (
                <>
                  <Icon icon="solar:floppy-disk-outline" width="18" height="18" /> Guardar
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
            <Button
            color="yellow"
            type="button"
            onClick={() => navigate(`/HuellaController/${clienteId}`)}
          >
            Editar Huella
          </Button>

          </div>
        </form>
      )}
    </div>
  );
}