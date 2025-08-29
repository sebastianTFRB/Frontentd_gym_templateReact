// src/pages/TipoDescuentoPage.tsx
import { useEffect, useState } from "react";
import { Table, Badge, Dropdown, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";

import {
  getTiposDescuento,
  deleteTipoDescuento,
  TipoDescuento,
} from "../../api/tipos_descuento";

export default function TipoDescuentoPage() {
  const [tipos, setTipos] = useState<TipoDescuento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TipoDescuento | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTiposDescuento();
      setTipos(res.data);
    } catch (err) {
      console.error("Error cargando tipos de descuento", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (tipo: TipoDescuento) => {
    setEditing(tipo);
    // Aquí podrías abrir un modal o redirigir a edit
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este descuento?")) return;
    try {
      await deleteTipoDescuento(id);
      fetchData();
    } catch (err) {
      console.error("Error eliminando tipo de descuento", err);
    }
  };

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Gestión de Tipos de Descuento</h5>

      <div className="mt-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell className="p-6">ID</Table.HeadCell>
                <Table.HeadCell>Nombre</Table.HeadCell>
                <Table.HeadCell>Porcentaje</Table.HeadCell>
                <Table.HeadCell>Acciones</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-border dark:divide-darkborder">
                {tipos.map((tipo) => (
                  <Table.Row key={tipo.id}>
                    {/* ID */}
                    <Table.Cell className="whitespace-nowrap ps-6">
                      <div className="flex flex-col">
                        <h6 className="text-sm font-medium">{tipo.id}</h6>
                      </div>
                    </Table.Cell>

                    {/* Nombre */}
                    <Table.Cell>
                      <h6 className="text-sm font-medium">{tipo.nombre_descuento}</h6>
                    </Table.Cell>

                    {/* Porcentaje */}
                    <Table.Cell>
                      <Badge color="lightprimary" className="text-primary">
                        {tipo.porcentaje_descuento}%
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
                        <Dropdown.Item
                          className="flex gap-3 cursor-pointer"
                          onClick={() => handleEdit(tipo)}
                        >
                          <Icon icon="solar:pen-new-square-broken" height={18} />
                          <span>Editar</span>
                        </Dropdown.Item>

                        <Dropdown.Item
                          className="flex gap-3 cursor-pointer text-red-600"
                          onClick={() => handleDelete(tipo.id)}
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
