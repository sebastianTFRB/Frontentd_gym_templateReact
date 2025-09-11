import { api } from "./apiConfig";

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
  // si tu back agrega id_membresia y nombre, puedes ampliar aquí
}

export interface Asistencia {
  id: number;
  id_cliente: number;
  id_venta: number;
  id_sede: number;
  fecha_hora_entrada: string; // ISO
  tipo_acceso: string;
  cliente?: AsistenciaCliente;
  venta?: AsistenciaVenta;
}

export const getAsistencias = (params?: { date?: string }) =>
  api.get<Asistencia[]>("/asistencias/", { params });

export const deleteAsistencia = (id: number) =>
  api.delete(`/asistencias/${id}`);
