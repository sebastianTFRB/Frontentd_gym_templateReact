import { useEffect, useMemo, useState } from "react";
import { Table, Spinner, Badge, Dropdown, Progress } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import SearchBar from "./SearchBarsimple";
import { Link } from "react-router-dom";
import { getResumenMembresias, ResumenMembresia } from "../../../api/membresias_resumen";

type PageData<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
  next?: string | null;
  prev?: string | null;
};

function formatDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO");
}

// ===== helpers para foto (maneja rutas relativas, absolutas y base64)
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
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
        // Fallback simple para evitar loop
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

export default function ResumenMembresias() {
  const [pageData, setPageData] = useState<PageData<ResumenMembresia> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);
    getResumenMembresias({ page, size: pageSize, q: query.trim() || undefined })
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
  }, [page, pageSize, query]);

  const rows = useMemo<ResumenMembresia[]>(() => pageData?.items ?? [], [pageData]);
  const totalPages = pageData?.pages ?? 1;
  const totalItems = pageData?.total ?? 0;

  const tableActionData = [
    { icon: "solar:add-circle-outline", listtitle: "Add" },
    { icon: "solar:pen-new-square-broken", listtitle: "Edit" },
    { icon: "solar:trash-bin-minimalistic-outline", listtitle: "Delete" },
  ];

  // helpers de UI
  const badgeColor = (estado: string): "success" | "failure" | "gray" | "info" => {
    const e = (estado || "").toLowerCase();
    if (e === "activa") return "success";
    if (e === "vencida") return "failure";
    if (e === "sin_membresia") return "gray";
    return "info";
  };
  const progressColor = (estado: string): "green" | "red" | "dark" => {
    const e = (estado || "").toLowerCase();
    if (e === "activa") return "green";
    if (e === "vencida") return "red";
    return "dark";
  };
  const clamp0to100 = (n: number | null | undefined) =>
    Math.max(0, Math.min(100, Number.isFinite(Number(n)) ? Number(n) : 0));

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <header className="flex items-center justify-between">
        <h5 className="card-title">Resumen de membresías</h5>
        <Link to="/clientes/new-with-membresia" className="btn">
          + Nuevo
        </Link>
      </header>

      <SearchBar
        query={query}
        onChange={(val: string) => {
          setQuery(val);
          setPage(1);
        }}
      />

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
                  return (
                    <Table.Row key={r.id}>
                      <Table.Cell>{r.id}</Table.Cell>

                      <Table.Cell>
                        <Foto src={r.foto} />
                      </Table.Cell>

                      <Table.Cell className="whitespace-nowrap ps-6">
                        <h5 className="text-base text-wrap">
                          <Link to={`/clientes/${r.id}/editar-membresia`} className="hover:underline">
                            {r.nombre} {r.apellido}
                          </Link>
                        </h5>
                        <div className="text-sm font-medium text-dark opacity-70 mb-2 text-wrap">CC. {r.documento}</div>
                      </Table.Cell>

                      <Table.Cell className="whitespace-nowrap ps-6">
                        <h5 className="text-base text-wrap">
                          Fecha inicio: {formatDate(r.fecha_inicio)} — Vence: {formatDate(r.fecha_fin)}
                        </h5>
                        <div className="text-sm font-medium text-dark opacity-70 mb-2 text-wrap">{precioFmt}</div>
                        <div className="me-5">
                          <Progress
                            progress={clamp0to100(r.sesiones_restantes)}
                            color={progressColor(r.estado)}
                            size="sm"
                          />
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
                          {tableActionData.map((items, index) => (
                            <Dropdown.Item key={index} className="flex gap-3">
                              <Icon icon={items.icon} height={18} />
                              <span>{items.listtitle}</span>
                            </Dropdown.Item>
                          ))}
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>

            {totalPages > 1 && (
              <div className="pagination mt-3 flex items-center gap-3">
                <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ⬅ Anterior
                </button>
                <span>
                  Página {page} de {totalPages} &nbsp;
                  <span className="badge">Total: {totalItems}</span>
                </span>
                <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente ➡
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
