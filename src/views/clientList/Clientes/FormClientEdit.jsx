import React from "react";




export default function FormClient({
  form,
  setForm,
  handleSubmit,
  loading,
  navigate,
  descuentos = [], 
  clientId,   // 👈 recibimos el id del cliente
}) {
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files.length > 0) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  return (
    <form onSubmit={handleSubmit}  >
      <label>Nombre</label>
      <input
        type="text"
        name="nombre"
        value={form?.nombre || ""}
        onChange={handleChange}
        placeholder="Ej. Juan"
        required
      />

      <label>Apellido</label>
      <input
        type="text"
        name="apellido"
        value={form?.apellido || ""}
        onChange={handleChange}
        placeholder="Ej. Pérez"
        required
      />

      <label>Documento</label>
      <input
        type="text"
        name="documento"
        value={form?.documento || ""}
        onChange={handleChange}
        required
      />

      <label>Fecha de Nacimiento</label>
      <input
        type="date"
        name="fecha_nacimiento"
        value={form?.fecha_nacimiento || ""}
        onChange={handleChange}
        required
      />

      <label>Teléfono</label>
      <input
        type="text"
        name="telefono"
        value={form?.telefono || ""}
        onChange={handleChange}
      />

      <label>Correo</label>
      <input
        type="email"
        name="correo"
        value={form?.correo || ""}
        onChange={handleChange}
        required
      />

      <label>Dirección</label>
      <input
        type="text"
        name="direccion"
        value={form?.direccion || ""}
        onChange={handleChange}
      />

      {/* --- CAMBIO: select en vez de input number --- */}
      <label>Tipo de Descuento</label>
      <select
        name="id_tipo_descuento"
        value={form?.id_tipo_descuento || ""}
        onChange={handleChange}
      >
        <option value="">-- Selecciona un descuento --</option>
        {descuentos.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombre_descuento} ({d.porcentaje_descuento}%)
          </option>
        ))}
      </select>

      <label>Huella</label>
      <button
        type="button"
         
        onClick={() => navigate(`/HuellaController/${clientId}`)} // 👈 ahora usa el id real
      >
        {form?.huella_template ? "Cambiar Huella" : "Subir Huella"}
      </button>

      <label>Fotografía</label>
      <input
        type="file"
        name="fotografia"
        accept="image/*"
        onChange={handleChange}
      />

      <div  >
        <button
          type="button"
         
          onClick={() => navigate("/")}
        >
          ⬅ Volver
        </button>
        <button type="submit"   disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
