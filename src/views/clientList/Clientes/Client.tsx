import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Cliente, getClientes } from "../../../api/clientes";
import { Table, Badge, Dropdown, Spinner, Button, TextInput } from "flowbite-react";
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




  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <h5 className="card-title">Gestión de Clientes</h5>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-64">
            <TextInput
              id="search"
              type="text"
              icon={() => <Icon icon="solar:magnifer-linear" height={18} />}
              placeholder="Buscar cliente..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button color="primary" onClick={() => navigate("/add-client")} className="flex items-center gap-2 whitespace-nowrap">
            <Icon icon="solar:add-circle-outline" className="mr-2" width={18} height={18} />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16 text-dark opacity-70">
            <Icon icon="solar:user-broken" width="48" className="mx-auto mb-2 opacity-50" />
            <p>No hay clientes registrados.</p>
          </div>
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
                  <Table.Row key={c.id}>
                    <Table.Cell className="ps-6">{c.id}</Table.Cell>

                    <Table.Cell>
                      <Link to={`/edit-client/${c.id}`} className="hover:opacity-80 transition-opacity">
                        <Foto src={foto} />
                      </Link>
                    </Table.Cell>

                    <Table.Cell className="whitespace-nowrap font-medium text-dark">
                      <Link to={`/edit-client/${c.id}`} className="hover:text-primary transition-colors">
                        {fullName || "—"}
                      </Link>
                    </Table.Cell>

                    <Table.Cell>
                      <span className="text-dark opacity-80">{c.documento || "—"}</span>
                    </Table.Cell>

                    <Table.Cell>
                      <span className="text-dark opacity-80">{c.correo || "—"}</span>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge color="success">Activo</Badge>
                    </Table.Cell>

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
                          className="flex gap-3 cursor-pointer"
                          onClick={() => navigate(`/edit-client/${c.id}`)}
                        >
                          <Icon icon="solar:pen-new-square-broken" height={18} />
                          <span>Editar</span>
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

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-dark opacity-70">
            Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <Button
              color="gray"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              color="gray"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
