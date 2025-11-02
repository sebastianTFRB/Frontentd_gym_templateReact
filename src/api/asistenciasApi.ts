import { api } from "./apiConfig";

/* =======================
   Interfaces de entidades
========================== */
export interface AsistenciaCliente {
  id: number;
  documento: string;
  nombre: string;
  apellido: string;
  fotografia?: string | null;
}

export interface AsistenciaVenta {
  id: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: string | null;
  sesiones_restantes?: number | null;
  // opcionalmente puedes agregar:
  // nombre_membresia?: string | null;
}

/* =======================
   Interfaz principal
========================== */
export interface Asistencia {
  id: number;
  id_cliente: number;
  id_venta: number;
  id_sede: number;
  fecha_hora_entrada: string; // ISO string
  tipo_acceso: string;

  // 🔹 Nuevo campo para controlar accesos denegados
  motivo_error?: string | null;

  // Relaciones
  cliente?: AsistenciaCliente;
  venta?: AsistenciaVenta;
}

/* =======================
   Funciones API
========================== */
export const getAsistencias = (params?: { date?: string }) =>
  api.get<Asistencia[]>("/asistencias/", { params });

export const deleteAsistencia = (id: number) =>
  api.delete(`/asistencias/${id}`);
