import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  getMembresias,
  createMembresia,
  updateMembresia,
  deleteMembresia,
  Membresia,
} from "../../api/membresias";
import { Badge, Dropdown, Progress, Table, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";

// 🔑 Definimos el tipo de Membresía


export default function Membresias() {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Membresia | null>(null);
  const navigate = useNavigate();

  const [form, setForm] = useState<Membresia>({
    id: 0,
    nombre_membresia: "",
    duracion_dias: 0,
    cantidad_sesiones: 0,
    precio_base: 0,
    max_accesos_diarios: 0,
  });

  // Cargar membresías
  const fetchMembresias = async () => {
    setLoading(true);
    try {
      const { data } = await getMembresias();
      setMembresias(data);
    } catch (err) {
      console.error("Error cargando membresías:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembresias();
  }, []);

  // Guardar / actualizar membresía
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMembresia(editing.id, form);
      } else {
        await createMembresia(form);
      }
      resetForm();
      fetchMembresias();
    } catch (err) {
      console.error("Error guardando membresía:", err);
      alert("Error al guardar membresía");
    }
  };

  // Eliminar membresía
  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta membresía?")) return;
    try {
      await deleteMembresia(id);
      fetchMembresias();
    } catch (err) {
      console.error("Error eliminando membresía:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      id: 0,
      nombre_membresia: "",
      duracion_dias: 0,
      cantidad_sesiones: 0,
      precio_base: 0,
      max_accesos_diarios: 0,
    });
    setEditing(null);
  };

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Gestión de Membresías</h5>

      <div className="mt-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell className="p-6">Nombre</Table.HeadCell>
                <Table.HeadCell>Precio</Table.HeadCell>
                <Table.HeadCell className="text-black font-semibold">
                  Duración
                </Table.HeadCell>

                <Table.HeadCell>Sesiones</Table.HeadCell>
                <Table.HeadCell>Accesos diarios</Table.HeadCell>
                <Table.HeadCell></Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-border dark:divide-darkborder">
                {membresias.map((m) => (
                  <Table.Row key={m.id}>
                    {/* Nombre */}
                    <Table.Cell className="whitespace-nowrap ps-6">
                      <div className="flex flex-col">
                        <h6 className="text-sm font-medium">
                          {m.nombre_membresia}
                        </h6>
                        <p className="text-xs text-dark opacity-70">
                          ID: {m.id}
                        </p>
                      </div>
                    </Table.Cell>

                    {/* Precio */}
                    <Table.Cell>
                      <h5 className="text-base">
                        ${m.precio_base}
                        <span className="text-dark opacity-70">
                          <span className="mx-1">/</span>COP
                        </span>
                      </h5>
                    </Table.Cell>

                    {/* Duración */}
                    <Table.Cell>
                      <Badge color="lightsecondary" className="text-secondary">
                        {m.duracion_dias} días
                      </Badge>
                    </Table.Cell>

                    {/* Sesiones */}
                    <Table.Cell>
                      <Badge color="lightprimary" className="text-primary">
                        {m.cantidad_sesiones} sesiones
                      </Badge>
                    </Table.Cell>

                    {/* Accesos */}
                    <Table.Cell>
                      <Progress
                        progress={
                          m.max_accesos_diarios > 0
                            ? (m.cantidad_sesiones / m.max_accesos_diarios) *
                              100
                            : 0
                        }
                        size="sm"
                        color="success"
                      />
                      <p className="text-xs opacity-70 mt-1">
                        {m.max_accesos_diarios} accesos/día
                      </p>
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
                        <Dropdown.Item
                          className="flex gap-3 cursor-pointer"
                          onClick={() => navigate(`/edit-membresia/${m.id}`)}
                        >
                          <Icon icon="solar:pen-new-square-broken" height={18} />
                          <span>Editar</span>
                        </Dropdown.Item>


                        <Dropdown.Item
                          className="flex gap-3 cursor-pointer text-red-600"
                          onClick={() => handleDelete(m.id)}
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
          </div>
        )}
      </div>
    </div>
  );
}
