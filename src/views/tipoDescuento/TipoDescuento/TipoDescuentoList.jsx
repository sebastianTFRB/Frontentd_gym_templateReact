// src/components/TipoDescuentoList.jsx
import React from "react";

export default function TipoDescuentoList({ tipos, onEdit, onDelete }) {
  return (
    <div  >
      <table  >
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Porcentaje</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.nombre_descuento}</td>
              <td>{t.porcentaje_descuento}%</td>
              <td>
                <button   onClick={() => onEdit(t)}>
                  Editar
                </button>
                <button   onClick={() => onDelete(t.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
