import React, { useEffect, useState } from "react";
import { getClientes } from "../api/clientes";
import { getMembresias } from "../api/membresias"; // Trae info de tipos de membresía (nombre)
import { getTiposDescuento } from "../api/tipos_descuento";
import { getVentasMembresia } from "../api/venta_membresia"; // Trae las ventas
import { Link } from "react-router-dom";
import SearchBar from "../components/Clientes/SearchBarsimple";


export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1); // 🚀 paginación
  const pageSize = 20;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientesRes, membresiasRes, ventasRes, descuentosRes] = await Promise.all([
          getClientes(),
          getMembresias(),
          getVentasMembresia(),
          getTiposDescuento(),
        ]);

        const clientesData = Array.isArray(clientesRes.data) ? clientesRes.data : clientesRes.data.data || [];
        const membresiasData = Array.isArray(membresiasRes.data) ? membresiasRes.data : membresiasRes.data.data || [];
        const ventasData = Array.isArray(ventasRes.data) ? ventasRes.data : ventasRes.data.data || [];
        const descuentosData = Array.isArray(descuentosRes.data) ? descuentosRes.data : descuentosRes.data.data || [];

        const clientesCombinados = clientesData.map(cliente => {
          const descuento = descuentosData.find(d => d.id === cliente.id_tipo_descuento);

          // Venta/membresía activa del cliente
          const ventaCliente = ventasData
            .filter(v => v.id_cliente === cliente.id)
            .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))[0];

          // Nombre real de la membresía
          const membresiaNombre = ventaCliente
            ? membresiasData.find(m => m.id === ventaCliente.id_membresia)?.nombre_membresia
            : null;

          return {
            ...cliente,
            descuento: descuento
              ? `${descuento.nombre_descuento} (${descuento.porcentaje_descuento}%)`
              : "Ninguno",
            membresia: membresiaNombre || "Sin membresía",
            sesiones_restantes: ventaCliente ? ventaCliente.sesiones_restantes : "-",
          };
        });

        setClientes(clientesCombinados);
        setMembresias(membresiasData);
        setVentas(ventasData);
        setDescuentos(descuentosData);

      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Filtro ---
  const filteredClientes = clientes.filter((c) => {
    const fullName = `${c.nombre || ""} ${c.apellido || ""}`.toLowerCase();
    const email = (c.correo || "").toLowerCase();
    const documento = (c.documento || "").toLowerCase();
    const search = query.toLowerCase();

    return (
      fullName.includes(search) ||
      email.includes(search) ||
      documento.includes(search)
    );
  });

  // --- Paginación ---
  const startIndex = (page - 1) * pageSize;
  const displayedClientes =
    query.trim() === ""
      ? filteredClientes.slice(startIndex, startIndex + pageSize)
      : filteredClientes;

  const totalPages = Math.ceil(filteredClientes.length / pageSize);

  return (
    <div >
      <header >
        <h1>GOLDEN Clientes</h1>
        <Link to="/clientes/new" >Nuevo Cliente</Link>
      </header>
      <div>
        <SearchBar
          query={query}
          onChange={(val) => {
            setQuery(val);
            setPage(1); // resetear página al buscar
          }}
        />

        {/* Card envolviendo la tabla */}
        <div >
          <div >
            {loading ? (
              <p >Cargando...</p>
            ) : displayedClientes.length === 0 ? (
              <p >No hay clientes registrados.</p>
            ) : (
              <div >
                <table >
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre completo</th>
                      <th>Documento</th>
                      <th>Email</th>
                      <th>Membresía</th>
                      <th>Sesiones restantes</th>
                      <th>Descuento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedClientes.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>
                          <Link to={`/clientes/edit/${c.id}`} >
                            {c.nombre} {c.apellido}
                          </Link>
                        </td>
                        <td>{c.documento}</td>
                        <td>{c.correo || "—"}</td>
                        <td>{c.membresia}</td>
                        <td>{c.sesiones_restantes}</td>
                        <td>{c.descuento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 🚀 Paginación solo si no hay búsqueda */}
                {query.trim() === "" && totalPages > 1 && (
                  <div >
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      ⬅ Anterior
                    </button>
                    <span>Página {page} de {totalPages}</span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Siguiente ➡
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
