import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Cliente, getClientes } from "../../../api/clientes";
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

// ================== helpers de imagen ==================
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
              Gestión de Clientes
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra la información personal y estados de tus clientes.
            </p>
          </div>

          <Link
            to="/add-client"
            className="group flex items-center justify-center gap-2 px-5 py-2.5 
                       bg-gradient-to-r from-primary to-yellow-500 text-white font-semibold rounded-xl 
                       shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 
                       transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Icon icon="solar:add-circle-bold" width="20" height="20" className="group-hover:rotate-90 transition-transform" />
            <span>Nuevo Cliente</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="p-6 flex flex-col lg:flex-row items-center justify-end gap-4 border-b border-gray-100 dark:border-gray-700 relative z-10">
          <div className="w-full lg:w-80 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="solar:magnifer-linear" className="text-gray-400 group-focus-within:text-primary transition-colors" width="20" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar cliente..."
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 
                         focus:border-primary transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="relative z-10 overflow-x-auto custom-scrollbar">
          {loading ? (
             <div className="p-12 text-center">
               <Spinner size="xl" color="warning" aria-label="Cargando..." />
               <p className="mt-3 text-gray-500 animate-pulse text-sm">Cargando clientes...</p>
             </div>
          ) : clientes.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Icon icon="solar:user-broken" width={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">No se encontraron clientes</h3>
              <p className="text-sm mt-1">Intenta ajustar la búsqueda o agrega un nuevo cliente.</p>
            </div>
          ) : (
            <Table hoverable className="w-full text-left bg-transparent">
              <Table.Head className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <Table.HeadCell className="py-4 pl-6 text-gray-500 font-semibold tracking-wider text-xs uppercase">INFO BÁSICA</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">DOCUMENTO</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">EMAIL</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">ESTADO</Table.HeadCell>
                <Table.HeadCell className="py-4 pr-6 text-right"><span className="sr-only">Acciones</span></Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-gray-100 dark:divide-gray-700">
                {clientes.map((c) => {
                  const fullName = `${c?.nombre || ""} ${c?.apellido || ""}`.trim();
                  const foto = (c as any)?.fotografia || (c as any)?.foto || null;
                  
                  return (
                    <Table.Row key={c.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      
                      {/* Info Básica */}
                      <Table.Cell className="py-4 pl-6">
                        <div className="flex items-center gap-4">
                          <Link to={`/edit-client/${c.id}`} className="relative shrink-0">
                            <Foto src={foto} />
                          </Link>
                          <div>
                            <Link to={`/edit-client/${c.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-1 text-base">
                              {fullName || "—"}
                            </Link>
                            <div className="text-xs text-gray-500 mt-0.5">
                              ID: {c.id}
                            </div>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Documento */}
                      <Table.Cell className="py-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg w-fit">
                          <Icon icon="solar:card-linear" width={16} />
                          <span className="font-medium text-sm">{c.documento || "—"}</span>
                        </div>
                      </Table.Cell>

                      {/* Email */}
                      <Table.Cell className="py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          {c.correo ? (
                            <>
                              <Icon icon="solar:letter-linear" width={16} />
                              <span className="text-sm">{c.correo}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </Table.Cell>

                      {/* Estado */}
                      <Table.Cell className="py-4">
                        <Badge color="success" className="text-xs font-bold uppercase tracking-wide gap-1 w-fit rounded-md px-2.5 py-1">
                          Activo
                        </Badge>
                      </Table.Cell>

                      {/* Acciones */}
                      <Table.Cell className="py-4 pr-6 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity justify-end flex">
                          <Dropdown inline label="" dismissOnClick={false} renderTrigger={() => (
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 transition-colors">
                              <HiOutlineDotsVertical className="w-5 h-5" />
                            </button>
                          )}>
                            <Dropdown.Item onClick={() => navigate(`/edit-client/${c.id}`)} className="flex items-center gap-2 text-sm">
                              <Icon icon="solar:pen-new-square-broken" className="text-gray-500" width={18} />
                              Editar Cliente
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
