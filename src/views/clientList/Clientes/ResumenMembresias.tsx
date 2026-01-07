// src/pages/Clientes/ResumenMembresias.tsx
import { useEffect, useMemo, useState } from "react";
import { Table, Spinner, Badge, Dropdown, Progress } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import {
  getResumenMembresias,
  ResumenMembresia,
  ResumenFiltro,
  ResumenPage,
} from "../../../api/membresias_resumen";
import { API_BASE_URL } from "../../../api/apiConfig";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  updateVentaMembresia,
  getVentaMembresia,
} from "../../../api/venta_membresia";

// ================== helpers comunes ==================
function formatDate(s?: string | null) {
  const d = parseDateOnlyLocal(s);
  return d ? d.toLocaleDateString("es-CO") : "—";
}

function parseDateOnlyLocal(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ===== helpers para foto
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

// ================== progreso por DÍAS restantes ==================
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function safeDate(s?: string | null): Date | null {
  return parseDateOnlyLocal(s);
}

function ceilDaysDiff(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / MS_PER_DAY);
}
function clamp0to100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function progressByRemainingDays(
  fecha_inicio?: string | null,
  fecha_fin?: string | null
): { progress: number; color: "red" | "yellow" | "green" | "dark"; daysLeft: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = safeDate(fecha_inicio);
  const end = safeDate(fecha_fin);

  if (!end) return { progress: 0, color: "dark", daysLeft: 0 };

  let totalDays = start ? ceilDaysDiff(start, end) : 30;
  if (!Number.isFinite(totalDays) || totalDays < 1) totalDays = 1;

  let remaining = ceilDaysDiff(today, end);
  if (!Number.isNaN(remaining) && remaining > totalDays) remaining = totalDays;
  if (!Number.isFinite(remaining) || remaining < 0) remaining = 0;

  const progress = clamp0to100((remaining / totalDays) * 100);

  let color: "red" | "yellow" | "green" | "dark" = "dark";
  if (remaining <= 5) color = "red";
  else if (remaining <= 10) color = "yellow";
  else color = "green";

  return { progress, color, daysLeft: remaining };
}

// ================== componente ==================
export default function ResumenMembresias() {
  const MySwal = withReactContent(Swal);

  const [pageData, setPageData] = useState<ResumenPage<ResumenMembresia> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filter, setFilter] = useState<ResumenFiltro>("todas");
  const [rowLoading, setRowLoading] = useState<number | null>(null); // id_venta en actualización

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    getResumenMembresias({
      page,
      size: pageSize,
      q: query.trim() || undefined,
      filtro: filter,
      include_counts: true,
    })
      .then((res) => {
        if (!mounted) return;
        setPageData(res.data);
        if (res.data?.page && res.data.page !== page) setPage(res.data.page);
      })
      .catch((e) => {
        console.error(e);
        if (mounted) setErr("No se pudo cargar el resumen de membresías.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [page, pageSize, query, filter]);

  const rows = useMemo<ResumenMembresia[]>(() => pageData?.items ?? [], [pageData]);
  const totalPages = pageData?.pages ?? 1;
  const totalItems = pageData?.total ?? 0;

  const badgeColor = (estado: string): "success" | "failure" | "gray" | "info" => {
    const e = (estado || "").toLowerCase();
    if (e === "activa") return "success";
    if (e === "vencida") return "failure";
    if (e === "sin_membresia") return "gray";
    return "info";
  };

  const pillBase = "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all";
  const pillActive =
    "text-black border-transparent bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)] shadow-[0_10px_18px_-10px_rgba(247,181,0,.45)]";
  const pillInactive =
    "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600";

  // ===== update optimista por id_venta
  const optimisticUpdate = (ventaId: number, nextSesiones: number) => {
    setPageData((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it: any) =>
        Number(it.id_venta) === Number(ventaId)
          ? { ...it, sesiones_restantes: nextSesiones }
          : it
      );
      return { ...prev, items };
    });
  };

  // ===== RESTAR SESIÓN (usa id_venta y el id de cliente del row)
  const handleRestarSesion = async (row: ResumenMembresia) => {
    const ventaId = Number((row as any).id_venta); // <-- id de la venta
    const clienteId = Number((row as any).id);      // <-- id del cliente (tu aclaración)
    const nombre = `${(row as any).nombre} ${(row as any).apellido}`
    if (!ventaId) {
      await MySwal.fire({
        icon: "error",
        title: "No se encontró la venta",
        text: "No se puede restar sesión porque falta 'id_venta'.",
        confirmButtonColor: "#dd0404ff",
      });
      return;
    }

    const current = Number((row as any).sesiones_restantes ?? 0);
    if (current <= 0) {
      await MySwal.fire({
        icon: "info",
        title: "Sin sesiones",
        text: "Esta membresía no tiene sesiones restantes para descontar.",
        confirmButtonColor: "#d2dd04ff",
      });
      return;
    }

    const ok = await MySwal.fire({
      icon: "question",
      title: `¿Restar 1 sesión a ${nombre}?`,
      text: `Sesiones: ${current} → ${current - 1}`,
      showCancelButton: true,
      confirmButtonText: "Sí, restar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d2dd04ff",
      cancelButtonColor: "#999999",
    });
    if (!ok.isConfirmed) return;

    try {
      setRowLoading(ventaId);

      // 1) Traer la venta para completar el payload (id_membresia, precio_final, fechas, estado)
      const ventaRes = await getVentaMembresia(ventaId);
      const v = ventaRes.data;

      // 2) Armamos el payload EXACTO que pide el endpoint
      const payload = {
        // 👇 Usamos el id del cliente que viene en el resumen (tu aclaración)
        id_cliente: clienteId,

        id_membresia: Number(v.id_membresia),
        fecha_inicio: (v.fecha_inicio || (row as any).fecha_inicio || "").toString().slice(0, 10),
        fecha_fin: (v.fecha_fin || (row as any).fecha_fin || "").toString().slice(0, 10),
        precio_final:
          v.precio_final != null
            ? Number(v.precio_final)
            : (row as any).precio != null
              ? Number((row as any).precio)
              : 0,
        estado: String(v.estado || (row as any).estado || "activa"),
        sesiones_restantes: current - 1,
      };

      // 3) UI optimista
      optimisticUpdate(ventaId, current - 1);

      // 4) PUT
      await updateVentaMembresia(ventaId, payload);

      await MySwal.fire({
        icon: "success",
        title: "Sesión restada",
        text: "Se actualizó correctamente.",
        confirmButtonColor: "#d2dd04ff",
      });
    } catch (e: any) {
      // revert
      optimisticUpdate(ventaId, current);
      console.error(e);
      await MySwal.fire({
        icon: "error",
        title: "Error",
        text: e?.message || "No se pudo actualizar.",
        confirmButtonColor: "#dd0404ff",
      });
    } finally {
      setRowLoading(null);
    }
  };

  return (
    <div className="p-6 transition-all duration-300 ease-in-out">
      {/* Main Card with Glass/Neumorphism feel */}
      <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 relative overflow-hidden">

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        {/* Header Section */}
        <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h5 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Icon icon="solar:users-group-rounded-bold-duotone" className="text-primary" />
              Resumen de Membresías
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gestiona el estado y sesiones de tus clientes activos.
            </p>
          </div>

          <Link
            to="/clientes/new-with-membresia"
            className="group flex items-center justify-center gap-2 px-5 py-2.5 
                       bg-gradient-to-r from-primary to-yellow-500 text-white font-semibold rounded-xl 
                       shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 
                       transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Icon icon="solar:add-circle-bold" width="20" height="20" className="group-hover:rotate-90 transition-transform" />
            <span>Nueva Membresía</span>
          </Link>
        </div>

        {/* Filters & Search Bar */}
        <div className="p-6 flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 relative z-10">

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {[{ id: 'todas', label: 'Todas' }, { id: 'activas', label: 'Activas' }, { id: 'por_vencer', label: 'Por Vencer' }, { id: 'vencidas', label: 'Vencidas' }].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setFilter(f.id as any); setPage(1); }}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                  ${filter === f.id
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"}
                `}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-80 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="solar:magnifer-linear" className="text-gray-400 group-focus-within:text-primary transition-colors" width="20" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Buscar cliente..."
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 
                         focus:border-primary transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="relative z-10 overflow-x-auto custom-scrollbar">
          {err ? (
            <div className="p-10 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg m-6 border border-red-100 dark:border-red-900/30">
              <Icon icon="solar:danger-circle-bold-duotone" className="mx-auto mb-2 text-4xl opacity-80" />
              <p className="font-medium">{err}</p>
            </div>
          ) : loading ? (
            <div className="p-12 text-center">
              <Spinner size="xl" color="warning" aria-label="Cargando..." />
              <p className="mt-3 text-gray-500 animate-pulse text-sm">Cargando membresías...</p>
            </div>
          ) : !rows.length ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 get-center mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Icon icon="solar:documents-minimalistic-broken" width={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">No se encontraron resultados</h3>
              <p className="text-sm mt-1">Intenta ajustar los filtros o busca otro nombre.</p>
            </div>
          ) : (
            <Table hoverable className="w-full text-left bg-transparent">
              <Table.Head className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <Table.HeadCell className="py-4 pl-6 text-gray-500 font-semibold tracking-wider text-xs uppercase">INFO BÁSICA</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">FECHAS & PROGRESO</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">ESTADO</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase text-center">SESIONES</Table.HeadCell>
                <Table.HeadCell className="py-4 pr-6 text-right"><span className="sr-only">Acciones</span></Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((r, index) => {
                  const precioFmt = (r as any).precio != null
                    ? Number((r as any).precio).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                    : "—";
                  const { progress, color, daysLeft } = progressByRemainingDays(r.fecha_inicio as any, r.fecha_fin as any);
                  const daysDisplay = typeof (r as any).days_left === "number" ? Math.max(0, Math.round((r as any).days_left)) : daysLeft;
                  const ventaIdForRow = Number((r as any).id_venta);
                  const isRowLoading = rowLoading != null && ventaIdForRow === rowLoading;

                  return (
                    <Table.Row key={`${(r as any).id}-${index}`} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      {/* Básico */}
                      <Table.Cell className="py-4 pl-6">
                        <div className="flex items-center gap-4">
                          <Link to={`/clientes/${(r as any).id}/editar-membresia`} className="relative shrink-0">
                            <Foto src={(r as any).foto} />
                          </Link>
                          <div>
                            <Link to={`/clientes/${(r as any).id}/editar-membresia`} className="font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-1 text-base">
                              {(r as any).nombre} {(r as any).apellido}
                            </Link>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Icon icon="solar:card-linear" width={14} />
                              {(r as any).documento}
                            </div>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Fechas */}
                      <Table.Cell className="py-4">
                        <div className="flex flex-col gap-1.5 min-w-[180px]">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Del <span className="text-gray-900 dark:text-white font-semibold">{formatDate(r.fecha_inicio)}</span> al <span className="text-gray-900 dark:text-white font-semibold">{formatDate(r.fecha_fin)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{precioFmt}</span>
                            <span className={`font-medium ${color === 'red' ? 'text-red-500' : ''}`}>
                              {Number.isFinite(daysDisplay) ? `${daysDisplay} días restantes` : "—"}
                            </span>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Estado */}
                      <Table.Cell className="py-4">
                        <Badge color={badgeColor((r as any).estado)} className="text-xs font-bold uppercase tracking-wide gap-1 w-fit rounded-md px-2.5 py-1" />
                      </Table.Cell>

                      {/* Sesiones */}
                      <Table.Cell className="py-4 text-center">
                        <div className="font-bold text-gray-800 dark:text-white text-base">
                          {(r as any).sesiones_restantes ?? "—"}
                        </div>
                        <div className="text-[10px] uppercase text-gray-400 tracking-wider">Disponicles</div>
                      </Table.Cell>

                      {/* Acciones */}
                      <Table.Cell className="py-4 pr-6 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity justify-end flex">
                          <Dropdown inline label="" dismissOnClick={false} renderTrigger={() => (
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 transition-colors">
                              <HiOutlineDotsVertical className="w-5 h-5" />
                            </button>
                          )}>
                            <Dropdown.Item as={Link} to={`/clientes/${(r as any).id}/editar-membresia`} className="flex items-center gap-2 text-sm">
                              <Icon icon="solar:pen-new-square-broken" className="text-gray-500" width={18} /> Editar Detalles
                            </Dropdown.Item>

                            <Dropdown.Item
                              onClick={() => handleRestarSesion(r)}
                              disabled={isRowLoading || Number((r as any).sesiones_restantes ?? 0) <= 0}
                              className="flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                              {isRowLoading ? <Spinner size="sm" /> : <Icon icon="solar:minus-square-linear" className="text-red-500" width={18} />}
                              <span className={isRowLoading ? "" : "text-red-600 font-medium"}>Restar Sesión</span>
                            </Dropdown.Item>
                          </Dropdown>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </div>

        {/* Footer / Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              Mostrando página <span className="font-bold">{page}</span> de <span className="font-bold">{totalPages}</span> — <span className="font-bold">{totalItems}</span> registros totales
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <Icon icon="solar:alt-arrow-left-linear" width={20} />
              </button>

              {/* Simplified Page Numbers */}
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                // Logic to show nearby pages
                let p = page;
                if (page < 3) p = 1 + i;
                else if (page > totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;

                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-white hover:text-primary'}`}
                  >
                    {p}
                  </button>
                )
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <Icon icon="solar:alt-arrow-right-linear" width={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
