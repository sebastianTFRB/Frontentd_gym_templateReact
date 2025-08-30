// src/api/membresias_resumen.ts
import { api } from "./apiConfig";

export type ResumenMembresia = {
  id: number;
  foto?: string | null;
  nombre: string;
  apellido: string;
  documento: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  precio?: number | null;
  sesiones_restantes?: number | null;
  estado: string;
  days_left?: number | null;
};

export type ResumenCounts = {
  todas: number;
  activas: number;
  por_vencer: number;
  vencidas: number;
};

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
  next?: string | null;
  prev?: string | null;
}

export type ResumenFiltro = "todas" | "activas" | "por_vencer" | "vencidas";

export interface GetResumenParams {
  page?: number;
  size?: number;
  q?: string;
  filtro?: ResumenFiltro;       // ← nuevo: filtro del backend
  include_counts?: boolean;     // ← nuevo: para traer conteos
}

export interface ResumenPage<T> extends Page<T> {
  counts?: ResumenCounts;       // ← opcional, llega si include_counts=true
}

// 🚩 Ruta correcta del backend:
export const getResumenMembresias = (params: GetResumenParams = {}) =>
  api.get<ResumenPage<ResumenMembresia>>("/clientes/membresias/resumen", { params });

// (opcional) detalle de la membresía actual de un cliente
export const getMembresiaActual = (clienteId: number) =>
  api.get<ResumenMembresia>(`/clientes/${clienteId}/membresia-actual`);
