// src/pages/VentaMembresiasPage.tsx
import { useEffect, useState } from "react";
import { Table, Dropdown, Badge, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";

import {
  getVentasMembresia,
  createVentaMembresia,
  updateVentaMembresia,
  deleteVentaMembresia,
  VentaMembresia,
} from "../../api/venta_membresia";
import { getClientes, Cliente } from "../../api/clientes";
import SearchBar from "../../views/ventaMembresias/VentaMembresia/SearchBar";

// 🔹 Diccionario de clientes para acceso rápido por id
type ClienteDict = Record<number, Cliente>;

export default function VentaMembresiasPage() {
  const [ventas, setVentas] = useState<VentaMembresia[]>([]);
  const [clientes, setClientes] = useState<ClienteDict>({});
  const [loading, setLoading] = useState(true);
  const [editingVenta, setEditingVenta] = useState<VentaMembresia | null>(null);
  const [search, setSearch] = useState<Cliente | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ventasRes, clientesRes] = await Promise.all([
        getVentasMembresia(),
        getClientes(),
      ]);
      setVentas(ventasRes.data);

      const dict: Record<number, Cliente> = {};
clientesRes.data.forEach((c: Cliente) => {
  dict[c.id] = c;
});

      setClientes(dict);
    } catch (err) {
      console.error("Error cargando ventas/clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (data: Omit<VentaMembresia, "id">) => {
    try {
      await createVentaMembresia(data);
      fetchData();
    } catch (err) {
      console.error("Error creando venta:", err);
    }
  };

  const handleUpdate = async (id: number, data: Partial<VentaMembresia>) => {
    try {
      await updateVentaMembresia(id, data);
      setEditingVenta(null);
      fetchData();
    } catch (err) {
      console.error("Error actualizando venta:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta venta?")) return;
    try {
      await deleteVentaMembresia(id);
      fetchData();
    } catch (err) {
      console.error("Error eliminando venta:", err);
    }
  };

  // 🔹 Filtrar ventas según búsqueda
  const filteredVentas = search
    ? ventas.filter((v) => v.id_cliente === search.id)
    : ventas;

  return (
    <div className="rounded-xl shadow-md bg-white dark:bg-darkgray p-6 w-full break-words">
      <h5 className="card-title mb-4">Gestión de Ventas de Membresías</h5>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <SearchBar
                data={Object.values(clientes)} // Usamos directamente los objetos Cliente
                displayField={(c) => `${c.nombre} ${c.apellido} – Doc: ${c.documento}`}
                inputDisplayField={(c) => `${c.nombre} ${c.apellido}`}
                placeholder="Buscar cliente..."
                value={search ? `${search.nombre} ${search.apellido}` : ""}
                onSelect={(c: Cliente) => setSearch(c)} // ahora c es de tipo Cliente
                />

            {search && (
              <p className="text-xs text-yellow-500 mt-1">
                Filtrando ventas de: {search.nombre} {search.apellido} (Doc: {search.documento})
              </p>
            )}
          </div>

          <VentaMembresiaTable
            ventas={filteredVentas}
            clientes={clientes}
            onEdit={setEditingVenta}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}

// 🔹 Componente de tabla decorada
interface VentaMembresiaTableProps {
  ventas: VentaMembresia[];
  clientes: ClienteDict;
  onEdit: (venta: VentaMembresia) => void;
  onDelete: (id: number) => void;
}

const VentaMembresiaTable = ({
  ventas,
  clientes,
  onEdit,
  onDelete,
}: VentaMembresiaTableProps) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(ventas.length / pageSize);
  const displayedVentas = ventas.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="overflow-x-auto">
      <Table hoverable>
        <Table.Head>
          <Table.HeadCell>Cliente</Table.HeadCell>
          <Table.HeadCell>Membresía</Table.HeadCell>
          <Table.HeadCell>Fecha Inicio</Table.HeadCell>
          <Table.HeadCell>Fecha Fin</Table.HeadCell>
          <Table.HeadCell>Precio Final</Table.HeadCell>
          <Table.HeadCell>Estado</Table.HeadCell>
          <Table.HeadCell>Sesiones Restantes</Table.HeadCell>
          <Table.HeadCell></Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y divide-border dark:divide-darkborder">
          {displayedVentas.map((v) => {
            const cliente = clientes[v.id_cliente];
            return (
              <Table.Row key={v.id}>
                <Table.Cell>
                  {cliente ? (
                    <>
                      <strong>
                        {cliente.nombre} {cliente.apellido}
                      </strong>
                      <br />
                      <span className="text-xs text-gray-500">
                        Doc: {cliente.documento}
                      </span>
                    </>
                  ) : (
                    v.id_cliente
                  )}
                </Table.Cell>
                <Table.Cell>{v.id_membresia}</Table.Cell>
                <Table.Cell>{v.fecha_inicio?.slice(0, 10)}</Table.Cell>
                <Table.Cell>{v.fecha_fin?.slice(0, 10)}</Table.Cell>
                <Table.Cell>${v.precio_final}</Table.Cell>
                <Table.Cell>
                  <Badge color={v.estado === "ACTIVO" ? "success" : "failure"}>
                    {v.estado}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{v.sesiones_restantes ?? "-"}</Table.Cell>
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
                      onClick={() => onEdit(v)}
                    >
                      <Icon icon="solar:pen-new-square-broken" height={18} />
                      Editar
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="flex gap-3 cursor-pointer text-red-600"
                      onClick={() => onDelete(v.id)}
                    >
                      <Icon icon="solar:trash-bin-minimalistic-outline" height={18} />
                      Eliminar
                    </Dropdown.Item>
                  </Dropdown>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            className="btn-pagination"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ⬅ Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            className="btn-pagination"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente ➡
          </button>
        </div>
      )}
    </div>
  );
};
