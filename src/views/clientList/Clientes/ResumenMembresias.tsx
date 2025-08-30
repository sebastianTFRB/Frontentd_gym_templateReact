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

// ================== helpers comunes ==================
function formatDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO");
}

// ===== helpers para foto (maneja rutas relativas, absolutas y base64)
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
// quita el sufijo /api/v1 o /api/v2... para apuntar al origen del server de archivos
const API_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, "");

function resolveFotoSrc(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("data:")) return src; // ya viene como dataURL
  if (/^https?:\/\//i.test(src)) return src; // URL absoluta
  if (src.startsWith("/")) return API_ORIGIN + src; // ruta absoluta en el backend (/media/...)
  if (src.startsWith("media/")) return `${API_ORIGIN}/${src}`; // ruta relativa (media/...)
  // si no coincide con lo anterior, tratamos como base64 crudo
  return `data:image/jpeg;base64,${src}`;
}

function Foto({ src }: { src?: string | null }) {
  const resolved = resolveFotoSrc(src);
  if (!resolved) {
    return <div style={{ width: 40, height: 40, borderRadius: 8, background: "#2d333b" }} />;
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
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        objectFit: "cover",
        border: "1px solid #2d333b",
      }}
    />
  );
}

// ================== progreso por DÍAS restantes ==================
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function safeDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
function ceilDaysDiff(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / MS_PER_DAY);
}
function clamp0to100(n: number) {
  return Math.max(0, Math.min(100, n));
}

/**
 * Calcula:
 *  - progress = (días_restantes / total_días) * 100 (decrece con el tiempo)
 *  - color: ≤5 red, 6–10 yellow, >10 green, "dark" si no hay fechas válidas
 *  - daysLeft: días restantes (>= 0)
 */
function progressByRemainingDays(
  fecha_inicio?: string | null,
  fecha_fin?: string | null
): { progress: number; color: "red" | "yellow" | "green" | "dark"; daysLeft: number } {
  const today = new Date();
  const start = safeDate(fecha_inicio);
  const end = safeDate(fecha_fin);

  if (!end) return { progress: 0, color: "dark", daysLeft: 0 };

  let totalDays = start ? ceilDaysDiff(start, end) : 30;
  if (!Number.isFinite(totalDays) || totalDays < 1) totalDays = 1;

  let remaining = ceilDaysDiff(today, end);
  if (!Number.isFinite(remaining)) remaining = 0;

  if (remaining > totalDays) remaining = totalDays;
  if (remaining < 0) remaining = 0;

  const progress = clamp0to100((remaining / totalDays) * 100);

  let color: "red" | "yellow" | "green" | "dark" = "dark";
  if (remaining <= 5) color = "red";
  else if (remaining <= 10) color = "yellow";
  else color = "green";

  return { progress, color, daysLeft: remaining };
}

// ================== componente ==================
export default function ResumenMembresias() {
  const [pageData, setPageData] = useState<ResumenPage<ResumenMembresia> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // filtro seleccionado (desde backend)
  const [filter, setFilter] = useState<ResumenFiltro>("todas");

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
  const counts = pageData?.counts ?? { todas: 0, activas: 0, por_vencer: 0, vencidas: 0 };

  const tableActionData = [
    { icon: "solar:add-circle-outline", listtitle: "Add" },
    { icon: "solar:pen-new-square-broken", listtitle: "Edit" },
  ];

  const badgeColor = (estado: string): "success" | "failure" | "gray" | "info" => {
    const e = (estado || "").toLowerCase();
    if (e === "activa") return "success";
    if (e === "vencida") return "failure";
    if (e === "sin_membresia") return "gray";
    return "info";
  };

  // estilos pills filtro
  const pillBase = "px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors";
  const pillActive = "bg-primary text-white border-primary shadow-btnshdw";
  const pillInactive =
    "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600";

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h5 className="card-title">Resumen de membresías</h5>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2">
          {/* Botón "+ Nuevo" con el estilo del template */}
          <Link
            to="/clientes/new-with-membresia"
            role="button"
            className="flex items-center justify-center px-4 py-3 gap-3 text-[15px] leading-[normal] font-normal text-white dark:text-white bg-primary rounded-xl hover:text-white hover:bg-primary dark:hover:text-white shadow-btnshdw"
          >
            <span className="flex gap-3 items-center">
              <Icon icon="solar:add-circle-outline" width="18" height="18" />
              <span className="max-w-24 truncate">Nuevo</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Filtros + Search */}
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Pills de filtro (usan conteos del backend) */}
        <div className="flex items-center gap-2">
          <button
            className={`${pillBase} ${filter === "todas" ? pillActive : pillInactive}`}
            onClick={() => {
              setFilter("todas");
              setPage(1);
            }}
            type="button"
          >
            Todas <span className="ml-1 text-xs opacity-75">({counts.todas})</span>
          </button>
          <button
            className={`${pillBase} ${filter === "activas" ? pillActive : pillInactive}`}
            onClick={() => {
              setFilter("activas");
              setPage(1);
            }}
            type="button"
          >
            Activas <span className="ml-1 text-xs opacity-75">({counts.activas})</span>
          </button>
          <button
            className={`${pillBase} ${filter === "por_vencer" ? pillActive : pillInactive}`}
            onClick={() => {
              setFilter("por_vencer");
              setPage(1);
            }}
            type="button"
          >
            Por vencer ≤5d <span className="ml-1 text-xs opacity-75">({counts.por_vencer})</span>
          </button>
          <button
            className={`${pillBase} ${filter === "vencidas" ? pillActive : pillInactive}`}
            onClick={() => {
              setFilter("vencidas");
              setPage(1);
            }}
            type="button"
          >
            Vencidas <span className="ml-1 text-xs opacity-75">({counts.vencidas})</span>
          </button>
        </div>

        {/* Search 1/2 de ancho en md+ */}
        <div className="w-full md:w-1/2">
          <div className="flex form-control form-rounded-xl">
            <div className="relative w-full">
              <input
                id="search"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar…"
                aria-label="Buscar"
                className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        {err ? (
          <p style={{ color: "crimson" }}>{err}</p>
        ) : loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Cargando…</span>
          </div>
        ) : !rows.length ? (
          <p>No hay datos.</p>
        ) : (
          <>
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell className="p-6">Id</Table.HeadCell>
                <Table.HeadCell>Foto</Table.HeadCell>
                <Table.HeadCell>Nombre</Table.HeadCell>
                <Table.HeadCell>Detalle</Table.HeadCell>
                <Table.HeadCell>Estado</Table.HeadCell>
                <Table.HeadCell>Sesiones</Table.HeadCell>
                <Table.HeadCell />
              </Table.Head>
              <Table.Body className="divide-y divide-border dark:divide-darkborder">
                {rows.map((r) => {
                  const precioFmt =
                    r.precio != null
                      ? Number(r.precio).toLocaleString("es-CO", { style: "currency", currency: "COP" })
                      : "—";

                  // progreso y días restantes (si backend manda days_left, lo usamos para mostrar)
                  const { progress, color, daysLeft } = progressByRemainingDays(
                    r.fecha_inicio as any,
                    r.fecha_fin as any
                  );
                  const daysDisplay =
                    typeof r.days_left === "number" && Number.isFinite(r.days_left)
                      ? Math.max(0, Math.round(r.days_left))
                      : daysLeft;

                  return (
                    <Table.Row key={r.id}>
                      <Table.Cell>{r.id}</Table.Cell>

                      <Table.Cell>
                        <Link to={`/clientes/${r.id}/editar-membresia`} className="hover:underline">
                          <Foto src={r.foto} />
                        </Link>
                      </Table.Cell>

                      <Table.Cell className="whitespace-nowrap ps-6">
                        <Link to={`/clientes/${r.id}/editar-membresia`} className="hover:underline">
                          <h5 className="text-base text-wrap">
                            {r.nombre} {r.apellido}
                          </h5>
                          <div className="text-sm font-medium text-dark opacity-70 mb-2 text-wrap">
                            CC. {r.documento}
                          </div>
                        </Link>
                      </Table.Cell>

                      <Table.Cell className="whitespace-nowrap ps-6">
                        <h5 className="text-base text-wrap">
                          Fecha inicio: {formatDate(r.fecha_inicio)} — Vence: {formatDate(r.fecha_fin)}
                        </h5>
                        <div className="text-sm font-medium text-dark opacity-70 mb-2 text-wrap">{precioFmt}</div>

                        <div className="me-5">
                          <Progress progress={progress} color={color} size="sm" />
                          <div className="text-xs opacity-70 mt-1">
                            {Number.isFinite(daysDisplay)
                              ? `${daysDisplay} día${daysDisplay === 1 ? "" : "s"} restantes`
                              : "—"}
                          </div>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <Badge color={badgeColor(r.estado)}>{r.estado}</Badge>
                      </Table.Cell>

                      <Table.Cell>{r.sesiones_restantes ?? "—"}</Table.Cell>

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
                          <Link to={`/clientes/${r.id}/editar-membresia`} className="w-full">
                            <Dropdown.Item className="flex gap-3">
                              <Icon icon="solar:pen-new-square-broken" height={18} />
                              <span>Editar</span>
                            </Dropdown.Item>
                          </Link>

                          <Link to="/clientes/new-with-membresia" className="w-full">
                            <Dropdown.Item className="flex gap-3">
                              <Icon icon="solar:add-circle-outline" height={18} />
                              <span>Agregar</span>
                            </Dropdown.Item>
                          </Link>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>

            {/* Paginación con iconos */}
            {totalPages > 1 && (
              <nav className="mt-4 flex items-center justify-between md:justify-end gap-3" aria-label="Paginación">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white shadow-btnshdw hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Anterior"
                >
                  <Icon icon="solar:alt-arrow-left-outline" width="18" height="18" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
                  <span className="ml-2 inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs">
                    Total: {totalItems}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white shadow-btnshdw hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Siguiente"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <Icon icon="solar:alt-arrow-right-outline" width="18" height="18" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
