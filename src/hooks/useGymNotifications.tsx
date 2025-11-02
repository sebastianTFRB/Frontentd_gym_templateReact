import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { GymNotification } from "../components/GymNotification";

/**
 * Hook global para escuchar el WebSocket del backend y mostrar
 * notificaciones de acceso en tiempo real (permitido / denegado).
 */
export function useGymNotifications() {
  useEffect(() => {
    function connect() {
      const host = window.location.hostname;
      const ws = new WebSocket(`ws://${host}:8000/ws/events`);

      ws.onopen = () => console.log("✅ Conectado al WebSocket del gimnasio");

      ws.onmessage = (event) => {
        if (event.data === "ping") return; // mantener viva la conexión

        try {
          const payload = JSON.parse(event.data);

          // Si el mensaje viene de MQTT reenviado (tópico global)
          if (payload.topic?.includes("/event")) {
            const data = payload.data;
            showGymNotification(data);
          }
          // Si el backend envía directamente el objeto enriquecido
          else if (payload.permitido !== undefined) {
            showGymNotification(payload);
          }
        } catch (err) {
          console.error("⚠️ Error procesando evento:", err);
        }
      };

      ws.onclose = () => {
        console.warn("🔌 WebSocket cerrado. Reintentando...");
        setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error("❌ Error en WebSocket:", err);
        ws.close();
      };
    }

    connect();
  }, []);
}

/**
 * Renderiza dinámicamente una notificación en pantalla.
 * El color depende de si el acceso fue permitido o no.
 */
function showGymNotification(data: any) {
  const {
    nombre,
    permitido,
    mensaje,
    foto,
    tipo_membresia,
    sesiones_restantes,
    dias_restantes,
    hora,
  } = data;

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  const remove = () => {
    root.unmount();
    container.remove();
  };

  root.render(
    <GymNotification
      nombre={nombre}
      mensaje={mensaje}
      foto={foto}
      hora={hora}
      permitido={permitido}
      tipoMembresia={tipo_membresia}
      sesionesRestantes={sesiones_restantes}
      diasRestantes={dias_restantes}
      onClose={remove}
    />
  );
}
