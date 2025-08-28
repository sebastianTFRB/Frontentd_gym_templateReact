// src/components/FormMembresia.jsx
import React from "react";

export default function FormMembresia(props) {
  const {
    formData, setFormData,      // opción nueva
    form, setForm,              // opción anterior
    handleSubmit,
    loading,
    navigate                    // opcional
  } = props;

  // Soporta ambos nombres de estado (formData o form)
  const state = formData ?? form ?? {
    nombre_membresia: "",
    duracion_dias: "",
    cantidad_sesiones: "",
    precio_base: "",
    max_accesos_diarios: ""
  };
  const setState = setFormData ?? setForm;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} >
      <label>Nombre</label>
      <input
        type="text"
        name="nombre_membresia"
        value={state?.nombre_membresia ?? ""}
        onChange={handleChange}
        placeholder="Ej. Membresía Premium"
        required
      />

      <label>Duración (días)</label>
      <input
        type="number"
        name="duracion_dias"
        value={state?.duracion_dias ?? ""}
        onChange={handleChange}
        placeholder="Ej. 30"
        required
      />

      <label>Cantidad de sesiones</label>
      <input
        type="number"
        name="cantidad_sesiones"
        value={state?.cantidad_sesiones ?? ""}
        onChange={handleChange}
        placeholder="Ej. 12"
      />

      <label>Precio base</label>
      <input
        type="number"
        step="0.01"
        name="precio_base"
        value={state?.precio_base ?? ""}
        onChange={handleChange}
        placeholder="Ej. 50.00"
        required
      />

      <label>Máx accesos diarios</label>
      <input
        type="number"
        name="max_accesos_diarios"
        value={state?.max_accesos_diarios ?? ""}
        onChange={handleChange}
        placeholder="Ej. 2"
      />

      <div  >
        {navigate && (
          <button
            type="button"
            
            onClick={() => navigate("/membresias")}
          >
            ⬅ Volver
          </button>
        )}
        <button type="submit"   disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
