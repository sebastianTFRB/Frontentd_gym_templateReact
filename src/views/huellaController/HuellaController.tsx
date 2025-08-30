// src/pages/HuellaController.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/apiConfig";
import { Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  correo?: string;
}

export default function HuellaController() {
const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const deviceId = 1; // temporal, luego se puede hacer dinámico

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar datos del cliente
  useEffect(() => {
    if (!id) return;

    const fetchCliente = async () => {
      try {
        setLoading(true);
        const res = await api.get<Cliente>(`/clientes/${id}`);
        setCliente(res.data);
      } catch (error) {
        console.error("Error cargando cliente:", error);
        alert("No se pudo cargar el cliente ❌");
      } finally {
        setLoading(false);
      }
    };

    fetchCliente();
  }, [id]);
  const handleBack = () => {
  navigate("/ClientList");
};

  const handleUpdateCommand = async () => {
    if (!id) return;

    try {
      const response = await api.post(`/dispositivo/dispositivo/${deviceId}/comando`, {
        comando: "update",
        cliente_id: Number(id),
        id_huella: 0,
      });

      console.log("Respuesta:", response.data);
      alert("Comando enviado correctamente ✅");
    } catch (error) {
      console.error("Error al enviar comando:", error);
      alert("Error al enviar comando ❌");
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-darkgray rounded-xl shadow-md w-full max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Huella Cliente #{id}</h2>

      <div className="mb-6">
        {cliente ? (
          <div className="grid grid-cols-1 gap-3 text-gray-800 dark:text-gray-200">
            <p>
              <strong>ID:</strong> {cliente.id}
            </p>
            <p>
              <strong>Nombre:</strong> {cliente.nombre} {cliente.apellido}
            </p>
            <p>
              <strong>Documento:</strong> {cliente.documento}
            </p>
            <p>
              <strong>Correo:</strong> {cliente.correo || "-"}
            </p>
          </div>
        ) : (
          <p>Cargando datos del cliente...</p>
        )}
      </div>

      <Button color="primary" onClick={handleUpdateCommand} disabled={loading}>
        {loading ? "Enviando comando..." : "Sincronizar Huellero"}
      </Button>
      <Button
        className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
        onClick={handleBack}
      >
        Volver
      </Button>
    </div>
  );
}
