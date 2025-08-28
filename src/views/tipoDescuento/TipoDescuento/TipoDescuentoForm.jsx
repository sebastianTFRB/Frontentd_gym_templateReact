// src/components/TipoDescuentoForm.jsx
import React, { useState, useEffect } from "react";
import { createTipoDescuento, updateTipoDescuento } from "../../api/tipos_descuento"; 


export default function TipoDescuentoForm({ onSuccess, editing, initialData, onCancel }) {
  const [form, setForm] = useState({ nombre_descuento: "", porcentaje_descuento: "" });

  useEffect(() => {
    if (editing && initialData) {
      setForm({
        nombre_descuento: initialData.nombre_descuento,
        porcentaje_descuento: initialData.porcentaje_descuento,
      });
    }
  }, [editing, initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Enviando:", form); 

    try {
      if (editing) {
        const res = await updateTipoDescuento(initialData.id, form);
        onSuccess(res.data); // ⬅️ devolvemos el actualizado
      } else {
        const res = await createTipoDescuento(form);
        onSuccess(res.data); // ⬅️ devolvemos el nuevo
        setForm({ nombre_descuento: "", porcentaje_descuento: "" }); // limpiar solo al agregar
      }
    } catch (error) {
      console.error("Error guardando tipo de descuento:", error);
    }
  };

  return (
    <form  onSubmit={handleSubmit}>
      <div>
        <label>Nombre del descuento</label>
        <input
          type="text"
          name="nombre_descuento"
          value={form.nombre_descuento}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Porcentaje (%)</label>
        <input
          type="number"
          name="porcentaje_descuento"
          value={form.porcentaje_descuento}
          onChange={handleChange}
          step="0.01"
          required
        />
      </div>

      <div  >
        <button type="submit"  >
          {editing ? "Actualizar" : "Agregar"}
        </button>
        {editing && (
          <button type="button"   onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
