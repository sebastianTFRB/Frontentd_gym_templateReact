// src/pages/HuellaController.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/apiConfig";
import { Button } from "flowbite-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const deviceId = 1; 

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [ready, setReady] = useState(false); // 🔹 nuevo estado para el mensaje

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

  const handleBack = () => navigate("/ClientList");

  const handleUpdateCommand = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.post(`/dispositivo/dispositivo/${deviceId}/comando`, {
        comando: "update",
        cliente_id: Number(id),
        id_huella: 0,
      });
      console.log("Respuesta:", response.data);

      alert("Comando enviado correctamente ✅");

      setShowScan(true); // activar escaneo
      setReady(true);    // activar mensaje
    } catch (error) {
      console.error("Error al enviar comando:", error);
      alert("Error al enviar comando ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-darkgray rounded-xl shadow-md w-full max-w-4xl mx-auto mt-10">

      {/* Contenedor flex para datos y huella */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 items-start">
        {/* Datos del cliente */}
        <div className="flex-1 text-gray-800 dark:text-gray-200">
          {cliente ? (
            <div className="grid grid-cols-1 gap-3">
              <h2 className="text-2xl font-bold mb-6">Huella Cliente #{id}</h2>
              <p><strong>ID:</strong> {cliente.id}</p>
              <p><strong>Nombre:</strong> {cliente.nombre} {cliente.apellido}</p>
              <p><strong>Documento:</strong> {cliente.documento}</p>
              <p><strong>Correo:</strong> {cliente.correo || "-"}</p>

              {/* 🔹 Mensaje de lector listo */}
              {ready && (
                <p className="mt-4 text-2xl font-bold text-green-600">
                 Lector preparado para escanear
              </p>
              

              )}
            </div>
          ) : (
            <p>Cargando datos del cliente...</p>
          )}
        </div>

        {/* Imagen de la huella con escaneo */}
        <div className="relative w-64 h-64">
          <img
            src="/huella.png"
            alt="Huella"
            className="w-full h-full object-contain"
          />

          <AnimatePresence>
            {showScan && (
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-green-400 rounded opacity-90"
                initial={{ y: 0 }}
                animate={{ y: ["0%", "6000%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
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
    </div>
  );
}
