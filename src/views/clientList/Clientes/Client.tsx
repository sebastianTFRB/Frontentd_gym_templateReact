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
        // si usas ordenamiento en el backend, descomenta:
        // sort: "nombre",
        // order: "asc",
      });
      setPageData(res.data);
      // si el backend ajusta la página (por ir más allá del final)
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
  }, [page, query]); // recarga cuando cambie página o búsqueda

  // El array seguro a mostrar (evita el "filter is not a function")
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
      loadClientes(); // recargar página actual
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el cliente.");
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">GOLDEN Clientes</h1>
        <NavLink to="/clientes/new" className="btn">
          Nuevo Cliente
        </NavLink>
      </header>

      {/* 🔍 Búsqueda */}
      <SearchBar
        query={query}
        onChange={(val: string) => {
          setQuery(val);
          setPage(1); // reset a la primera página cuando buscas
        }}
      />

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Cargando…</span>
          </div>
        ) : !clientes.length ? (
          <p>No hay clientes registrados.</p>
        ) : (
          <>
            <Table>
              <Table.Head>
                <Table.HeadCell>ID</Table.HeadCell>
                <Table.HeadCell>Nombre completo</Table.HeadCell>
                <Table.HeadCell>Documento</Table.HeadCell>
                <Table.HeadCell>Email</Table.HeadCell>
                <Table.HeadCell>Acciones</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {clientes.map((c) => (
                  <Table.Row key={c.id}>
                    <Table.Cell>{c.id}</Table.Cell>
                    <Table.Cell>
                      <NavLink to={`/clientes/edit/${c.id}`} className="hover:underline">
                        {c.nombre} {c.apellido}
                      </NavLink>
                    </Table.Cell>
                    <Table.Cell>{c.documento}</Table.Cell>
                    <Table.Cell>{c.correo || "—"}</Table.Cell>
                    <Table.Cell>
                      <Dropdown
                        label={<HiOutlineDotsVertical />}
                        dismissOnClick={true}
                        inline
                        renderTrigger={() => (
                          <button className="p-1 rounded hover:bg-gray-700/30">
                            <HiOutlineDotsVertical />
                          </button>
                        )}
                      >
                        <Dropdown.Item onClick={() => navigate(`/clientes/edit/${c.id}`)}>
                          <Icon icon="mdi:pencil" className="mr-2" />
                          <span>Editar</span>
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onDelete(c.id)}>
                          <Icon icon="mdi:trash-can-outline" className="mr-2" />
                          <span>Eliminar</span>
                        </Dropdown.Item>
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {/* Paginación del backend */}
            {totalPages > 1 && (
              <div className="pagination">
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
          </>
        )}
      </div>
    </div>
  );
}
