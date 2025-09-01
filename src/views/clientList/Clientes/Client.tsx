import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { Cliente, getClientes, deleteCliente } from "../../../api/clientes";
import { Table, Badge, Dropdown, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import { API_BASE_URL } from "../../../api/apiConfig";
// ================== tipos ==================
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

// ================== helpers de imagen (mismo patrón del otro listado) ==================
const API_BASE = API_BASE_URL
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

// ================== componente ==================
export default function ClientesList() {
  const [pageData, setPageData] = useState<PageData<Cliente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const navigate = useNavigate();

  // Cargar clientes paginados desde API
  const loadClientes = async () => {
    setLoading(true);
    try {
      const res = await getClientes({
        page,
        size: pageSize,
        q: query.trim() || undefined,
      });
      setPageData(res.data);
      if (res.data?.page && res.data.page !== page) setPage(res.data.page);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query]);

  const clientes = useMemo<Cliente[]>(
    () => (Array.isArray(pageData?.items) ? pageData!.items : []),
    [pageData]
  );

  const totalPages = pageData?.pages ?? 1;
  const totalItems = pageData?.total ?? 0;

  // 🔥 Eliminar cliente
  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await deleteCliente(id);
      loadClientes();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el cliente.");
    }
  };

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      {/* Header con botón dorado */}
      <header className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h5 className="card-title">Clientes</h5>

        <NavLink
          to="/add-client"
          className="flex items-center justify-center px-4 py-3 gap-3 text-[15px]
                     leading-[normal] font-medium text-black
                     bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                     rounded-xl shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                     hover:brightness-[1.03] hover:-translate-y-[1px] active:translate-y-0 transition-all
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-start,#FFD54A)]/60 focus:ring-offset-2"
        >
          <Icon icon="solar:add-circle-outline" width="18" height="18" />
          <span>Nuevo</span>
        </NavLink>
      </header>

      {/* 🔍 Búsqueda – a 1/2 de ancho */}
      <div className="mb-4 w-full md:w-1/2">
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
              placeholder="Buscar por nombre, documento o email…"
              aria-label="Buscar"
              className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50
                         text-gray-900 focus:border-cyan-500 focus:ring-cyan-500
                         dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                         dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 🚀 Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        ) : clientes.length === 0 ? (
          <p className="text-center py-6">No hay clientes registrados.</p>
        ) : (
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell className="p-6">Id</Table.HeadCell>
              <Table.HeadCell>Foto</Table.HeadCell>
              <Table.HeadCell>Nombre</Table.HeadCell>
              <Table.HeadCell>Documento</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Estado</Table.HeadCell>
              <Table.HeadCell />
            </Table.Head>
            <Table.Body className="divide-y divide-border dark:divide-darkborder">
              {clientes.map((c) => {
                const fullName = `${c?.nombre || ""} ${c?.apellido || ""}`.trim();
                const foto = (c as any)?.fotografia || (c as any)?.foto || null;

                return (
                  <Table.Row
                    key={c.id}
                    className="hover:bg-[rgba(255,213,74,0.06)] transition-colors"
                  >
                    {/* Id */}
                    <Table.Cell>{c.id}</Table.Cell>

                    {/* Foto */}
                    <Table.Cell>
                      <Link to={`/edit-client/${c.id}`} className="hover:underline">
                        <Foto src={foto} />
                      </Link>
                    </Table.Cell>

                    {/* Nombre */}
                    <Table.Cell className="whitespace-nowrap ps-6">
                      <Link to={`/edit-client/${c.id}`} className="hover:underline">
                        <h5 className="text-base text-wrap">{fullName || "—"}</h5>
                      </Link>
                    </Table.Cell>

                    {/* Documento */}
                    <Table.Cell>
                      <span className="text-sm">{c.documento || "—"}</span>
                    </Table.Cell>

                    {/* Email */}
                    <Table.Cell>
                      <span className="text-sm">{c.correo || "—"}</span>
                    </Table.Cell>

                    {/* Estado (placeholder) */}
                    <Table.Cell>
                      <Badge color="success">activo</Badge>
                    </Table.Cell>

                    {/* Acciones */}
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
                        {/* Editar */}
                        <Dropdown.Item
                          className="flex gap-3 cursor-pointer"
                          onClick={() => navigate(`/edit-client/${c.id}`)}
                        >
                          <Icon icon="solar:pen-new-square-broken" height={18} />
                          <span>Editar</span>
                        </Dropdown.Item>

                        {/* Eliminar */}
                        <Dropdown.Item
                          className="flex gap-3 cursor-pointer text-red-600"
                          onClick={() => onDelete(c.id)}
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

      {/* Paginación con iconos y dorado */}
      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between md:justify-end gap-3" aria-label="Paginación">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                       text-black shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                       hover:brightness-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Anterior"
          >
            <Icon icon="solar:alt-arrow-left-outline" width="18" height="18" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-300">
            Página <span className="font-semibold">{page}</span> de{" "}
            <span className="font-semibold">{totalPages}</span>
            <span className="ml-2 inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs">
              Total: {totalItems}
            </span>
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                       text-black shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                       hover:brightness-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <Icon icon="solar:alt-arrow-right-outline" width="18" height="18" />
          </button>
        </nav>
      )}
    </div>
  );
}
