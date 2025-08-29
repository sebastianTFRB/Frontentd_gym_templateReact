// src/api/tipos_descuento.ts
import { api } from "./apiConfig";

// Definimos la interfaz según el modelo del backend
export interface TipoDescuento {
  id: number;
  nombre_descuento: string;
  porcentaje_descuento: number;
}

// Peticiones a la API con tipado
export const getTiposDescuento = () => api.get<TipoDescuento[]>("/tipos-descuento/");
export const getTipoDescuento = (id: number) => api.get<TipoDescuento>(`/tipos-descuento/${id}`);
export const createTipoDescuento = (data: Omit<TipoDescuento, "id">) =>
  api.post<TipoDescuento>("/tipos-descuento/", data);
export const updateTipoDescuento = (id: number, data: Partial<TipoDescuento>) =>
  api.put<TipoDescuento>(`/tipos-descuento/${id}`, data);
export const deleteTipoDescuento = (id: number) =>
  api.delete(`/tipos-descuento/${id}`);
