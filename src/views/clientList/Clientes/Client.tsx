import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Cliente, getClientes, deleteCliente } from "../../../api/clientes";
import SearchBar from "./SearchBarsimple";
import { Table, Badge, Dropdown, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";

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
      <header className="flex items-center justify-between mb-4">
        <h5 className="card-title">Clientes</h5>
        <NavLink to="/add-client" className="btn">
          Nuevo Cliente
        </NavLink>
      </header>

      {/* 🔍 Búsqueda */}
      <div className="mb-4">
        <SearchBar
          query={query}
          onChange={(val: string) => {
            setQuery(val);
            setPage(1);
          }}
        />
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
              <Table.HeadCell className="p-6">Cliente</Table.HeadCell>
              <Table.HeadCell>Documento</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Estado</Table.HeadCell>
              <Table.HeadCell></Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y divide-border dark:divide-darkborder">
              {clientes.map((c) => (
                <Table.Row key={c.id}>
                  {/* Cliente */}
                  <Table.Cell className="whitespace-nowrap ps-6">
                    <div className="flex gap-3 items-center">
                      <div className="h-[50px] w-[50px] flex items-center justify-center rounded-md bg-lightprimary text-primary font-bold">
                        {c.nombre?.charAt(0) || "C"}
                      </div>
                      <div className="truncate max-w-56">
                        <NavLink
                          to={`/edit-client/${c.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {c.nombre} {c.apellido}
                        </NavLink>
                        <p className="text-xs text-dark opacity-70">
                          ID: {c.id}
                        </p>
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Documento */}
                  <Table.Cell>
                    <span className="text-sm">{c.documento || "—"}</span>
                  </Table.Cell>

                  {/* Email */}
                  <Table.Cell>
                    <span className="text-sm">{c.correo || "—"}</span>
                  </Table.Cell>

                  {/* Estado */}
                  <Table.Cell>
                    <Badge color="lightsuccess" className="text-success">
                      Activo
                    </Badge>
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
                        className="flex gap-3 cursor-pointer text-yellow-300"
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
                        <Icon
                          icon="solar:trash-bin-minimalistic-outline"
                          height={18}
                        />
                        <span>Eliminar</span>
                      </Dropdown.Item>
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination mt-4 flex items-center justify-between">
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ⬅ Anterior
          </button>
          <span>
            Página {page} de {totalPages} &nbsp;
            <span className="badge">Total: {totalItems}</span>
          </span>
          <button
            className="btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente ➡
          </button>
        </div>
      )}
    </div>
  );
}
