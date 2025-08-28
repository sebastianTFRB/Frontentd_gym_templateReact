// src/components/Clientes/ClientesList.tsx
import React, { useEffect, useState } from "react";
import { Cliente, getClientes } from "../../../api/clientes";
import { NavLink } from "react-router";
import SearchBar from "./SearchBarsimple";
import { Table, Badge, Dropdown, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";

export default function ClientesList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  // Acciones
  const tableActionData = [
    { icon: "solar:add-circle-outline", listtitle: "Agregar" },
    { icon: "solar:pen-new-square-broken", listtitle: "Editar" },
    { icon: "solar:trash-bin-minimalistic-outline", listtitle: "Eliminar" },
  ];

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Clientes</h5>

      {/* 🔍 Barra de búsqueda */}
      <div className="mt-3 mb-4">
        <SearchBar query={query} onChange={setQuery} />
      </div>

      {/* 🚀 Tabla estilo ProductTable */}
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
                  {/* ✅ Columna cliente con estilo */}
                  <Table.Cell className="whitespace-nowrap ps-6">
                    <div className="flex gap-3 items-center">
                      {/* Si tuvieras foto, va aquí */}
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

                  {/* Estado (ejemplo: activo/inactivo) */}
                  <Table.Cell>
                    <Badge
                      color="lightsuccess"
                      className="text-success"
                    >
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
                      {tableActionData.map((items, index) => (
                        <Dropdown.Item key={index} className="flex gap-3">
                          <Icon icon={items.icon} height={18} />
                          <span>{items.listtitle}</span>
                        </Dropdown.Item>
                      ))}
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
