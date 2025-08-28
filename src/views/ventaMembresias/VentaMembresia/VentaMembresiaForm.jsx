import React, { useState, useEffect } from "react";
import { getClientes } from "../../api/clientes";
import { getMembresias } from "../../api/membresias";
import { getTipoDescuento } from "../../api/tipos_descuento"; 
import SearchBar from "./SearchBar";

export default function VentaMembresiaForm({ onCreate, onUpdate, editingVenta, setEditingVenta }) {
  const initialFormState = {
    id_cliente: "",
    id_membresia: "",
    fecha_inicio: "",
    fecha_fin: "",
    precio_final: "",
    estado: "",
    sesiones_restantes: "",
    descuento: 0,
  };

  const [form, setForm] = useState(initialFormState);
  const [clientes, setClientes] = useState([]);
  const [membresias, setMembresias] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resClientes = await getClientes();
        const resMembresias = await getMembresias();
        setClientes(resClientes.data);
        setMembresias(resMembresias.data);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    fetchData();
  }, []);

  // Cargar datos al editar
  useEffect(() => {
    if (editingVenta) {
      setForm(editingVenta);
    } else {
      setForm(initialFormState);
    }
  }, [editingVenta]);

  // Manejo de cambios
  const handleChange = async (e) => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };

    if (name === "id_cliente") {
      const cliente = clientes.find(c => c.id === parseInt(value));
      if (cliente && cliente.id_tipo_descuento) {
        try {
          const res = await getTipoDescuento(cliente.id_tipo_descuento);
          newForm.descuento = res.data.porcentaje_descuento;
          if (form.id_membresia) {
            const memb = membresias.find(m => m.id === parseInt(form.id_membresia));
            if (memb) {
              newForm.precio_final = memb.precio_base * (1 - res.data.porcentaje_descuento / 100);
            }
          }
        } catch (err) {
          console.error("Error obteniendo tipo descuento:", err);
          newForm.descuento = 0;
        }
      } else {
        newForm.descuento = 0;
      }
    }

    if (name === "id_membresia") {
      const memb = membresias.find(m => m.id === parseInt(value));
      if (memb) {
        newForm.precio_final = memb.precio_base * (1 - newForm.descuento / 100);
        newForm.sesiones_restantes = memb.cantidad_sesiones || 0;
      }
    }

    setForm(newForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVenta) {
      onUpdate(editingVenta.id, form);
      setEditingVenta(null); // salir de modo edición
    } else {
      onCreate(form);
    }
    // 🔹 Resetear el formulario al terminar
    setForm(initialFormState);
  };

  return (
    <form className="form-venta" onSubmit={handleSubmit}>
      <h3>{editingVenta ? "Editar Venta" : "Nueva Venta"}</h3>

      {/* Cliente */}
      <div>
        <label>Cliente</label>
        <SearchBar
            data={clientes}
            displayField={(c) =>
              `${c.nombre} ${c.apellido} – Doc: ${c.documento} – ${c.correo}`
            }
            inputDisplayField={(c) => `${c.nombre} ${c.apellido}`}
            placeholder="Buscar cliente..."
            value={
              form.id_cliente
                ? (() => {
                    const c = clientes.find(c => c.id === parseInt(form.id_cliente));
                    return c ? `${c.nombre} ${c.apellido}` : "";
                  })()
                : ""
            }
            onSelect={(cliente) => {
              handleChange({ target: { name: "id_cliente", value: cliente.id } });
            }}
          />

        {form.id_cliente && (
          <p style={{ fontSize: "12px", color: "#ffd700" }}>
            Cliente seleccionado:{" "}
            {(() => {
              const c = clientes.find(c => c.id === parseInt(form.id_cliente));
              return c ? `${c.nombre} ${c.apellido} (Doc: ${c.documento})` : "";
            })()}
          </p>
        )}
      </div>

      {/* Descuento */}
      <div>
        <label>Descuento (%)</label>
        <input type="number" value={form.descuento} disabled />
      </div>

      {/* Membresía */}
      <div>
        <label>Membresía</label>
        <select
          name="id_membresia"
          value={form.id_membresia}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione una membresía</option>
          {membresias.map(m => (
            <option key={m.id} value={m.id}>
              {m.nombre_membresia} - ${m.precio_base}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Fecha Inicio</label>
        <input
          type="date"
          name="fecha_inicio"
          value={form.fecha_inicio}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Fecha Fin</label>
        <input
          type="date"
          name="fecha_fin"
          value={form.fecha_fin}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Precio Final</label>
        <input
          type="number"
          name="precio_final"
          value={form.precio_final}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Estado</label>
        <input
          type="text"
          name="estado"
          value={form.estado}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Sesiones Restantes</label>
        <input
          type="number"
          name="sesiones_restantes"
          value={form.sesiones_restantes}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {editingVenta ? "Actualizar" : "Registrar"}
        </button>
        {editingVenta && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setEditingVenta(null)}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
