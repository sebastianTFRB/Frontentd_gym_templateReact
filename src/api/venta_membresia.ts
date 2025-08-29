// src/api/ventaMembresiaApi.ts
import { api } from "./apiConfig";

// 🔹 Modelo TS según el backend
export interface VentaMembresia {
  id: number;
  id_cliente: number;
  id_membresia: number;
  fecha_inicio?: string; // ISO string
  fecha_fin?: string;    // ISO string
  precio_final: number;
  estado: string;
  sesiones_restantes?: number;
}

// Base URL
const BASE_URL = "/ventas-membresias/";

// Obtener todas las ventas
export const getVentasMembresia = () => api.get<VentaMembresia[]>(BASE_URL);

// Obtener una venta por id
export const getVentaMembresia = (id: number) =>
  api.get<VentaMembresia>(`${BASE_URL}${id}/`);

// Crear venta
export const createVentaMembresia = (data: Omit<VentaMembresia, "id">) =>
  api.post<VentaMembresia>(BASE_URL, data);

// Actualizar venta
export const updateVentaMembresia = (
  id: number,
  data: Partial<Omit<VentaMembresia, "id">>
) => api.put<VentaMembresia>(`${BASE_URL}${id}/`, data);

// Eliminar venta
export const deleteVentaMembresia = (id: number) =>
  api.delete(`${BASE_URL}${id}/`);
