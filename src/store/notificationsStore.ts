import { create } from "zustand";

export interface Notification {
  id: number;
  nombre: string;
  mensaje: string;
  foto?: string;
  permitido?: boolean;
  tipoMembresia?: string | null;
  sesionesRestantes?: number | null;
  diasRestantes?: number | null;
  hora?: string;
}

interface NotificationState {
  notifications: Notification[];
  hasNew: boolean;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
  clearNewFlag: () => void;
}

export const useNotificationsStore = create<NotificationState>((set) => ({
  notifications: [],
  hasNew: false,

  addNotification: (notification) =>
    set((state) => {
      const isDuplicate = state.notifications.some(
        (n) =>
          n.nombre === notification.nombre &&
          n.mensaje === notification.mensaje &&
          n.hora === notification.hora
      );
      if (isDuplicate) return state; // evita duplicados

      const updated = [notification, ...state.notifications].slice(0, 5);
      return { notifications: updated, hasNew: true };
    }),

  clearNotifications: () => set({ notifications: [], hasNew: false }),

  clearNewFlag: () => set({ hasNew: false }),
}));
