// src/pages/VentaMembresiasPage.jsx
import React, { useEffect, useState } from "react";
import {
  getVentasMembresia,
  createVentaMembresia,
  updateVentaMembresia,
  deleteVentaMembresia,
} from "../api/venta_membresia";
import { getClientes } from "../api/clientes";

import VentaMembresiaForm from "../components/VentaMembresia/VentaMembresiaForm";
import VentaMembresiaList from "../components/VentaMembresia/VentaMembresiaList";

export default function VentaMembresiasPage() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState({}); // 🔹 diccionario id → {nombre, documento}
  const [loading, setLoading] = useState(true);
  const [editingVenta, setEditingVenta] = useState(null);

  // cargar ventas y clientes
  const loadData = async () => {
    try {
      setLoading(true);
      const [ventasRes, clientesRes] = await Promise.all([
        getVentasMembresia(),
        getClientes(),
      ]);

      setVentas(ventasRes.data);

      // 🔹 diccionario clientes con nombre y documento
      const dict = {};
      clientesRes.data.forEach((c) => {
        dict[c.id] = {
          nombre: `${c.nombre} ${c.apellido}`,
          documento: c.documento,
        };
      });
      setClientes(dict);
    } catch (err) {
      console.error("Error cargando ventas/clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (data) => {
    try {
      await createVentaMembresia(data);
      loadData();
    } catch (err) {
      console.error("Error creando venta:", err);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateVentaMembresia(id, data);
      setEditingVenta(null);
      loadData();
    } catch (err) {
      console.error("Error actualizando venta:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVentaMembresia(id);
      loadData();
    } catch (err) {
      console.error("Error eliminando venta:", err);
    }
  };

  return (
    <div  >
      <div  >
        {/* --- Card de Ventas --- */}
        <div  >
          <h2>Gestión de Ventas de Membresías</h2>

          <div  >
            <div  >
              <VentaMembresiaForm
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                editingVenta={editingVenta}
                setEditingVenta={setEditingVenta}
              />
            </div>

            <div  >
              <h3>Lista de Ventas</h3>
              <VentaMembresiaList
                ventas={ventas}
                clientes={clientes} // 👈 ahora con nombre + documento
                loading={loading}
                onEdit={setEditingVenta}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
