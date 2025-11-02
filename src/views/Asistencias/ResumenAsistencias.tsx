import { useEffect, useMemo, useState } from "react";
import { Table, Spinner, Dropdown } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { getAsistencias, deleteAsistencia, Asistencia } from "../../api/asistenciasApi";
import { API_BASE_URL } from "../../api/apiConfig";

/* ================= Helpers ================= */
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
function formatDate(s?: string | null) {
  const d = parseDateOnlyLocal(s);
  return d ? d.toLocaleDateString("es-CO") : "—";
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatDateForAccess(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO");
}
function timeHHmm(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
function ceilDaysDiff(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / MS_PER_DAY);
}
function daysLeftFromToday(fechaFin?: string | null) {
  const end = parseDateOnlyLocal(fechaFin);
  if (!end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return ceilDaysDiff(today, end);
}
function vencimientoColor(days: number | null): "green" | "yellow" | "red" | "dark" {
  if (days === null) return "dark";
  if (days <= 5) return "red";
  if (days <= 10) return "yellow";
  return "green";
}

/* ===== Foto helpers */
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
function Foto({ src }: { src?: string | null }) {
  const resolved = resolveFotoSrc(src);
  if (!resolved) {
    return (
      <div
        className="w-10 h-10 rounded-lg bg-[#2d333b] ring-2 ring-[var(--color-gold-start,#FFD54A)]/40"
        aria-hidden
      />
    );
  }
  return (
    <img
      src={resolved}
      alt="foto"
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement & { __fallback?: boolean };
        if (!el.__fallback) {
          el.__fallback = true;
          el.src =
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
                 <rect width='100%' height='100%' rx='8' fill='#2d333b'/>
               </svg>`
            );
        }
      }}
      className="w-10 h-10 rounded-lg object-cover border border-[#2d333b] ring-2 ring-[var(--color-gold-start,#FFD54A)]/40"
    />
  );
}

/* ================= Componente ================= */
export default function ResumenAsistencias() {
  const MySwal = withReactContent(Swal);

  const [rows, setRows] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getAsistencias({ date: todayStr() });
      let data = Array.isArray(res.data) ? res.data : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      data = data.filter((a) => {
        const fh = new Date(a.fecha_hora_entrada);
        return fh >= today && fh < tomorrow;
      });

      data.sort(
        (a, b) =>
          new Date(b.fecha_hora_entrada).getTime() - new Date(a.fecha_hora_entrada).getTime()
      );

      setRows(data);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar las asistencias del día.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const sNombre = `${r.cliente?.nombre ?? ""} ${r.cliente?.apellido ?? ""}`.trim().toLowerCase();
      const sDoc = (r.cliente?.documento ?? "").toLowerCase();
      const sTipo = (r.tipo_acceso ?? "").toLowerCase();
      const sHora = timeHHmm(r.fecha_hora_entrada).toLowerCase();
      return sNombre.includes(q) || sDoc.includes(q) || sTipo.includes(q) || sHora.includes(q);
    });
  }, [rows, query]);

  const onDelete = async (id: number, nombre: string) => {
    const result = await MySwal.fire({
      icon: "warning",
      title: `¿Eliminar asistencia de ${nombre}?`,
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dd0404ff",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAsistencia(id);
      await MySwal.fire({
        icon: "success",
        title: "Eliminada",
        text: `La asistencia de ${nombre} fue eliminada.`,
        confirmButtonColor: "#d2dd04ff",
      });
      loadData();
    } catch (e) {
      console.error(e);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo eliminar la asistencia de ${nombre}.`,
        confirmButtonColor: "#dd0404ff",
      });
    }
  };

  const TipoChip = ({ tipo }: { tipo?: string | null }) => {
    const t = (tipo || "").toUpperCase();
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white">
        <Icon icon="solar:fingerprint-linear" width={14} height={14} />
        {t || "—"}
      </span>
    );
  };

  const AccesoCompact = ({ fh, tipo }: { fh?: string | null; tipo?: string | null }) => {
    const fecha = formatDateForAccess(fh);
    const hora = timeHHmm(fh);
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-gray-900 text-white dark:bg-gray-700">
          <Icon icon="solar:clock-circle-outline" width={14} height={14} />
          {fecha} • {hora}
        </span>
        <TipoChip tipo={tipo} />
      </div>
    );
  };

  const EstadoAcceso = ({ motivo }: { motivo?: string | null }) => {
    if (motivo) {
      return (
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-red-600 text-white">
            <Icon icon="solar:danger-triangle-outline" width={14} height={14} />
            Acceso NO permitido
          </span>
          <span className="text-sm text-red-600 mt-1 italic">{motivo}</span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white">
        <Icon icon="solar:check-circle-outline" width={14} height={14} />
        Acceso permitido
      </span>
    );
  };

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h5 className="card-title">Asistencias de hoy</h5>
        <button
          type="button"
          onClick={loadData}
          className="flex items-center justify-center px-4 py-3 gap-3 text-[15px]
                     leading-[normal] font-medium text-black
                     bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                     rounded-xl shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                     hover:brightness-[1.03] hover:-translate-y-[1px] active:translate-y-0 transition-all"
        >
          <Icon icon="solar:refresh-outline" width="18" height="18" />
          <span>Actualizar</span>
        </button>
      </header>

      {/* Search */}
      <div className="mt-3 w-full md:w-1/2">
        <input
          id="search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, documento, tipo, hora…"
          className="block w-full border border-gray-300 bg-gray-50 text-gray-900 p-2.5 text-sm rounded-lg"
        />
      </div>

      <div className="mt-3">
        {err ? (
          <p style={{ color: "crimson" }}>{err}</p>
        ) : loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Cargando…</span>
          </div>
        ) : !filtered.length ? (
          <p>No hay accesos registrados hoy.</p>
        ) : (
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Id</Table.HeadCell>
              <Table.HeadCell>Foto</Table.HeadCell>
              <Table.HeadCell>Nombre</Table.HeadCell>
              <Table.HeadCell>Acceso</Table.HeadCell>
              <Table.HeadCell>Estado</Table.HeadCell>
              <Table.HeadCell>Sesiones</Table.HeadCell>
              <Table.HeadCell />
            </Table.Head>

            <Table.Body className="divide-y divide-border dark:divide-darkborder">
              {filtered.map((a) => {
                const nombre = `${a.cliente?.nombre ?? ""} ${a.cliente?.apellido ?? ""}`.trim() || `Cliente #${a.id_cliente}`;
                const doc = a.cliente?.documento ?? "—";
                const sesiones = a.venta?.sesiones_restantes ?? "—";

                return (
                  <Table.Row key={a.id} className="hover:bg-[rgba(255,213,74,0.06)] transition-colors">
                    <Table.Cell>{a.id}</Table.Cell>
                    <Table.Cell><Foto src={a.cliente?.fotografia} /></Table.Cell>

                    <Table.Cell className="whitespace-nowrap ps-6">
                      <h5 className="text-base text-wrap">{nombre}</h5>
                      <div className="text-sm font-medium text-dark opacity-70">CC. {doc}</div>
                    </Table.Cell>

                    <Table.Cell><AccesoCompact fh={a.fecha_hora_entrada} tipo={a.tipo_acceso} /></Table.Cell>
                    <Table.Cell><EstadoAcceso motivo={a.motivo_error} /></Table.Cell>
                    <Table.Cell>{sesiones}</Table.Cell>

                    <Table.Cell>
                      <Dropdown
                        label=""
                        dismissOnClick={false}
                        renderTrigger={() => (
                          <span className="h-9 w-9 flex justify-center items-center rounded-full hover:bg-lightprimary hover:text-primary cursor-pointer">
                            <HiOutlineDotsVertical size={22} />
                          </span>
                        )}
                      >
                        <Dropdown.Item
                          className="flex gap-3 text-red-600"
                          onClick={() => onDelete(a.id, nombre)}
                        >
                          <Icon icon="solar:trash-bin-minimalistic-outline" height={18} />
                          <span>Eliminar</span>
                        </Dropdown.Item>
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </div>
    </div>
  );
}
