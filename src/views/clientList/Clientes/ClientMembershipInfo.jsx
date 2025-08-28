// src/components/Clientes/ClientMembershipInfo.jsx
import React, { useEffect, useState } from "react";
import { getVentasMembresia } from "../../api/venta_membresia";
import { getMembresias } from "../../api/membresias";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs"; // librería para manejar fechas


export default function ClientMembershipInfo({ clientId }) {
  const [info, setInfo] = useState({
    membresia: "Sin membresía",
    sesiones_restantes: "-",
    fecha_fin: "-",
    estado: "-",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembership = async () => {
      setLoading(true);
      try {
        const [ventasRes, membresiasRes] = await Promise.all([
          getVentasMembresia(),
          getMembresias(),
        ]);

        const ventas = Array.isArray(ventasRes.data)
          ? ventasRes.data
          : ventasRes.data?.data ?? [];

        const membresias = Array.isArray(membresiasRes.data)
          ? membresiasRes.data
          : membresiasRes.data?.data ?? [];

        // Última venta del cliente por fecha_inicio
        const ventaCliente = ventas
          .filter((v) => Number(v.id_cliente) === Number(clientId))
          .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))[0];

        if (ventaCliente) {
          const memb = membresias.find(
            (m) => Number(m.id) === Number(ventaCliente.id_membresia)
          );

          const nombreMembresia =
            memb?.nombre_membresia || memb?.nombre || `ID ${ventaCliente.id_membresia}`;

          // comparar fechas
          let estado = "Activa";
          if (ventaCliente.fecha_fin && dayjs().isAfter(dayjs(ventaCliente.fecha_fin))) {
            estado = "Vencida";
          }

          setInfo({
            membresia: nombreMembresia,
            sesiones_restantes: ventaCliente.sesiones_restantes ?? "-",
            fecha_fin: ventaCliente.fecha_fin || "-",
            estado,
          });
        } else {
          setInfo({
            membresia: "Sin membresía",
            sesiones_restantes: "-",
            fecha_fin: "-",
            estado: "-",
          });
        }
      } catch (err) {
        console.error("Error cargando membresía del cliente:", err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchMembership();
  }, [clientId]);

  return (
    <div  >
      <h3 >Información de Membresía</h3>
      {loading ? (
        <p  >Cargando...</p>
      ) : (
        <div>
          <ul  >
            <li><strong>Membresía:</strong> {info.membresia}</li>
            <li><strong>Sesiones restantes:</strong> {info.sesiones_restantes}</li>
            <li><strong>Fecha de vencimiento:</strong> {info.fecha_fin}</li>
            {info.membresia !== "Sin membresía" && (
              <li><strong>Estado:</strong> {info.estado}</li>
            )}
          </ul>

          {info.membresia === "Sin membresía" && (
            <button
             
              onClick={() => navigate("/ventas_membresias")}
            >
              Comprar Membresía
            </button>
          )}
        </div>
      )}
    </div>
  );
}
