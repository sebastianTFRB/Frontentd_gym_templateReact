// src/pages/HuellaController.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../api/apiConfig";
import { Button } from "flowbite-react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";


interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  correo?: string;
}

export default function HuellaController() {
  const MySwal = withReactContent(Swal);
  
  


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

  const handleBack = () => navigate(-1);

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
      MySwal.fire({
        icon: "success",
        title: "¡Comando enviado!",
        text: "El huellero está sincronizado correctamente ✅",
        confirmButtonColor: "#3085d6",
      });

      setShowScan(true); // activar escaneo
      setReady(true);    // activar mensaje
    } catch (error) {
      console.error("Error al enviar comando:", error);
      MySwal.fire({
        icon: "error",
        title: "¡Comando enviado!",
        text: "Error al enviar comando",
        confirmButtonColor: "#d63030ff",
      });
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
              <Link
                to={`/clientes/${cliente.id}/editar-membresia`}
                role="button"
                className="flex items-center justify-center px-4 py-3 gap-3 text-[15px]
                            leading-[normal] font-medium text-black
                            bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                            rounded-xl shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                            hover:brightness-[1.03] hover:-translate-y-[1px] active:translate-y-0 transition-all
                            focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-start,#FFD54A)]/60 focus:ring-offset-2"
              >
                <Icon icon="openmoji:return" width="18" height="18" />
                <span>Volver</span>
              </Link>
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
        
      </div>
    </div>
  );
}
