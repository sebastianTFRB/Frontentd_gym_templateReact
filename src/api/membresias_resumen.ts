// src/api/membresias_resumen.ts
import { api } from "./apiConfig";

export interface ResumenMembresia {
  id: number;
  foto?: string | null;
  documento: string;
  nombre: string;
  apellido: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  precio?: number | null;
  sesiones_restantes?: number | null;
  estado: string; 
}

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

export interface PageParams {
  page?: number;
  size?: number;
  q?: string;
}

export const getResumenMembresias = (params: PageParams = {}) =>
  api.get<Page<ResumenMembresia>>("/clientes/membresias/resumen", { params });

export const getMembresiaActual = (clienteId: number) =>
  api.get<ResumenMembresia>(`/clientes/${clienteId}/membresia-actual`);
