// src/pages/HuellaController.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/apiConfig"; // 👈 axios config

export default function HuellaController() {
  const { id } = useParams(); // cliente_id que viene de la URL
  const deviceId = 1; // temporal, puedes hacerlo dinámico después

  const [cliente, setCliente] = useState(null);

  // 🔹 Cargar datos del cliente
  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const res = await api.get(`/clientes/${id}`);
        setCliente(res.data);
      } catch (error) {
        console.error("Error cargando cliente:", error);
        alert("No se pudo cargar el cliente ❌");
      }
    };
    fetchCliente();
  }, [id]);

  const handleUpdateCommand = async () => {
    try {
      const response = await api.post(
        `/dispositivo/dispositivo/${deviceId}/comando`,
        {
          comando: "update",
          cliente_id: id,
          id_huella: 0,
        }
      );

      console.log("Respuesta:", response.data);
      alert("Comando enviado correctamente ✅");
    } catch (error) {
      console.error("Error al enviar comando:", error);
      alert("Error al enviar comando ❌");
    }
  };

  return (
    <div >
      <div >
        <h2>Huella Cliente #{id}</h2>

        <div >
          {cliente ? (
            <div>
              <p><strong>ID:</strong> {cliente.id}</p>
              <p><strong>Nombre:</strong> {cliente.nombre} {cliente.apellido}</p>
              <p><strong>Documento:</strong> {cliente.documento}</p>
              <p><strong>Correo:</strong> {cliente.correo}</p>
            </div>
          ) : (
            <p>Cargando datos del cliente...</p>
          )}

          <button  onClick={handleUpdateCommand}>
            Sincronizar Huellero
          </button>
        </div>
      </div>
    </div>
  );
}
