import { useEffect } from "react";
import { useNotificationsStore } from "../store/notificationsStore";
import ReactDOM from "react-dom/client";
import { GymNotification } from "../components/GymNotification";

export function useGymNotifications() {
  const addNotification = useNotificationsStore((state) => state.addNotification);

  useEffect(() => {
    let ws: WebSocket | null = null;

    function connect() {
      const host = window.location.hostname;
      ws = new WebSocket(`ws://${host}:8000/ws/events`);

      ws.onopen = () => console.log("✅ Conectado al WebSocket del gimnasio");

      ws.onmessage = (event) => {
        if (event.data === "ping") return;

        try {
          const payload = JSON.parse(event.data);
          if (payload.topic?.includes("/event")) {
            const data = payload.data;
            const id = data.id || Date.now();

            const notif = {
              id,
              nombre: data.nombre,
              mensaje: data.mensaje,
              foto: data.foto,
              permitido: data.permitido,
              tipoMembresia: data.tipo_membresia,
              sesionesRestantes: data.sesiones_restantes,
              diasRestantes: data.dias_restantes,
              hora: data.hora,
            };

            addNotification(notif);
            showGymNotification(notif);
          }
        } catch (err) {
          console.error("⚠️ Error procesando evento:", err);
        }
      };

      ws.onclose = () => {
        console.warn("🔌 WebSocket cerrado. Reintentando en 5s...");
        setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error("❌ Error en WebSocket:", err);
        ws?.close();
      };
    }

    connect();
    return () => ws?.close();
  }, [addNotification]);
}

function showGymNotification(data: any) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  const remove = () => {
    root.unmount();
    container.remove();
  };

  root.render(
    <GymNotification
      nombre={data.nombre}
      mensaje={data.mensaje}
      foto={data.foto}
      hora={data.hora}
      permitido={data.permitido}
      tipoMembresia={data.tipoMembresia}
      sesionesRestantes={data.sesionesRestantes}
      diasRestantes={data.diasRestantes}
      onClose={remove}
    />
  );
}
