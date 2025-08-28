import React from "react";


export default function MembresiaList({ membresias, loading, onEdit, onDelete }) {
  if (loading) return <p>Cargando membresías...</p>;

  if (membresias.length === 0) {
    return <p  > No hay membresías registradas.</p>;
  }

  return (
    <div  >
      <table  >
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Duración (días)</th>
            <th>Sesiones</th>
            <th>Precio</th>
            <th>Accesos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {membresias.map((m) => (
            <tr key={m.id}>
              <td>{m.nombre_membresia}</td>
              <td>{m.duracion_dias}</td>
              <td>{m.cantidad_sesiones || "-"}</td>
              <td>${m.precio_base}</td>
              <td>{m.max_accesos_diarios || "-"}</td>
              <td  >
              <div  >
                <button
                  
                  onClick={() => onEdit(m)}
                >
                  Editar
                </button>
                <button
                 
                  onClick={() => onDelete(m.id)}
                >
                  Eliminar
                </button>
              </div>
            </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
