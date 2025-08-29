import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Cliente, getClientes, deleteCliente } from "../../../api/clientes"; // 👈 importar deleteCliente
import SearchBar from "./SearchBarsimple";
import { Table, Badge, Dropdown, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";

export default function ClientesList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Cargar clientes
  const loadClientes = async () => {
    setLoading(true);
    try {
      const res = await getClientes();
      setClientes(res.data);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // 🔥 Eliminar cliente
  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que quieres eliminar este cliente?")) return;
    setLoading(true);
    try {
      await deleteCliente(id);
      alert("Cliente eliminado correctamente ✅");
      loadClientes(); // recargar lista
    } catch (err) {
      console.error("Error eliminando cliente:", err);
      alert("No se pudo eliminar el cliente ❌");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado
  const filteredClientes = clientes.filter((c) => {
    const fullName = `${c.nombre || ""} ${c.apellido || ""}`.toLowerCase();
    const email = (c.correo || "").toLowerCase();
    const documento = (c.documento || "").toLowerCase();
    return (
      fullName.includes(query.toLowerCase()) ||
      email.includes(query.toLowerCase()) ||
      documento.includes(query.toLowerCase())
    );
  });

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Clientes</h5>

      {/* 🔍 Barra de búsqueda */}
      <div className="mt-3 mb-4">
        <SearchBar query={query} onChange={setQuery} />
      </div>

      {/* 🚀 Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        ) : filteredClientes.length === 0 ? (
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
              {filteredClientes.map((c) => (
                <Table.Row key={c.id}>
                  {/* Cliente */}
                  <Table.Cell className="whitespace-nowrap ps-6">
                    <div className="flex gap-3 items-center">
                      <div className="h-[50px] w-[50px] flex items-center justify-center rounded-md bg-lightprimary text-primary font-bold">
                        {c.nombre.charAt(0)}
                      </div>
                      <div className="truncate max-w-56">
                        <NavLink
                          to={`/clientes/edit/${c.id}`}
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
                        className="flex gap-3 cursor-pointer"
                        onClick={() => navigate(`/edit-client/${c.id}`)}
                      >
                        <Icon icon="solar:pen-new-square-broken" height={18} />
                        <span>Editar</span>
                      </Dropdown.Item>

                      {/* Eliminar */}
                      <Dropdown.Item
                        className="flex gap-3 cursor-pointer text-red-600"
                        onClick={() => handleDelete(c.id)}
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
    </div>
  );
}
