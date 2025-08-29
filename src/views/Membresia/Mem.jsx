// src/pages/Membresias.jsx
import React, { useEffect, useState } from "react";
import {
  getMembresias,
  createMembresia,
  updateMembresia,
  deleteMembresia,
} from "../api/membresias";
import FormMembresia from "../components/membrecias/FormMembresia";
import MembresiaList from "../components/membrecias/MembresiasList";


export default function Membresias() {
  const [membresias, setMembresias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre_membresia: "",
    duracion_dias: "",
    cantidad_sesiones: "",
    precio_base: "",
    max_accesos_diarios: "",
  });

  // cargar lista
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

  // guardar/actualizar
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMembresia(editing, form);
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

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta membresía?")) return;
    try {
      await deleteMembresia(id);
      fetchMembresias();
    } catch (err) {
      console.error("Error eliminando membresía:", err);
    }
  };

  const resetForm = () => {
    setForm({
      nombre_membresia: "",
      duracion_dias: "",
      cantidad_sesiones: "",
      precio_base: "",
      max_accesos_diarios: "",
    });
    setEditing(null);
  };

  return (
    <div >
      <div  >
        <h2>Gestión de Membresías</h2>

        <div  >
          {/* Formulario */}
          <div >
            <FormMembresia
              formData={form}
              setFormData={setForm}
              handleSubmit={handleSubmit}
              loading={false}
              onCancel={editing ? resetForm : null}
            />
          </div>

          {/* Lista */}
          <div  >
            <h3>Lista de Membresías</h3>
            <MembresiaList
              membresias={membresias}
              loading={loading}
              onEdit={(m) => {
                setEditing(m.id);
                setForm(m);
              }}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
