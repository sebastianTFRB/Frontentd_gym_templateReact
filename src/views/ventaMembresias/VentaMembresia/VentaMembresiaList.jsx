import React, { useState } from "react";
import "../../styles/VentaMemList.css";
import SearchBar from "./SearchBarG";

export default function VentaMembresiaList({ ventas, clientes, loading, onEdit, onDelete }) {
  const [search, setSearch] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // 🚀 límite de registros por página

  if (loading) return <p className="loading-text">Cargando ventas...</p>;
  if (!ventas || ventas.length === 0) return <p className="empty-text">No hay ventas registradas.</p>;

  // 🔹 Filtrar ventas por búsqueda
  const filteredVentas = search
    ? ventas.filter((v) => {
        const c = clientes[v.id_cliente];
        if (!c) return false;
        const fullText = `${c.nombre} ${c.apellido} ${c.documento} ${c.correo}`.toLowerCase();
        return fullText.includes(search.nombre?.toLowerCase() || "");
      })
    : ventas;

  // 🔹 Paginación (si no hay búsqueda activa)
  const startIndex = (page - 1) * pageSize;
  const displayedVentas =
    search === null
      ? filteredVentas.slice(startIndex, startIndex + pageSize)
      : filteredVentas;

  const totalPages = Math.ceil(filteredVentas.length / pageSize);

  return (
    <div className="ventas-card">
      {/* 🔎 Barra de búsqueda */}
      <div style={{ marginBottom: "15px" }}>
        <SearchBar
          data={Object.values(clientes)}
          displayField={(c) =>
            `${c.nombre} ${c.apellido} – Doc: ${c.documento} – ${c.correo}`
          }
          inputDisplayField={(c) => `${c.nombre} ${c.apellido}`}
          placeholder="Buscar cliente..."
          value={search ? `${search.nombre} ${search.apellido}` : ""}
          onSelect={(cliente) => {
            setSearch(cliente);
            setPage(1); // resetear página al filtrar
          }}
        />
        {search && (
          <p style={{ fontSize: "12px", color: "#ffd700" }}>
            Filtrando ventas de: {search.nombre} {search.apellido} (Doc: {search.documento})
          </p>
        )}
      </div>

      {/* Tabla de ventas */}
      <div className="table-container">
        <table className="ventas-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Membresía</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Precio Final</th>
              <th>Estado</th>
              <th>Sesiones Restantes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedVentas.map((v) => {
              const cliente = clientes[v.id_cliente];
              return (
                <tr key={v.id}>
                  <td>
                    {cliente ? (
                      <>
                        <strong>{cliente.nombre} {cliente.apellido}</strong>
                        <br />
                        <span style={{ fontSize: "12px", color: "#888" }}>
                          Doc: {cliente.documento}
                        </span>
                      </>
                    ) : v.id_cliente}
                  </td>
                  <td>{v.id_membresia}</td>
                  <td>{v.fecha_inicio?.slice(0, 10)}</td>
                  <td>{v.fecha_fin?.slice(0, 10)}</td>
                  <td>${v.precio_final}</td>
                  <td>{v.estado}</td>
                  <td>{v.sesiones_restantes ?? "-"}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-edit" onClick={() => onEdit(v)}>
                        Editar
                      </button>
                      <button className="btn-delete" onClick={() => onDelete(v.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 🚀 Paginación solo si no hay búsqueda */}
        {search === null && totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              ⬅ Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Siguiente ➡
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
