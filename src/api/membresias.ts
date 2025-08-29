// src/api/membresiasApi.ts
import { api } from "./apiConfig";

// Definimos la interfaz Membresia según tu modelo en Python
export interface Membresia {
  id: number;
  nombre_membresia: string;
  duracion_dias: number;
  cantidad_sesiones: number;
  precio_base: number;
  max_accesos_diarios: number;
}

// Peticiones a la API con tipado
export const getMembresias = () => api.get<Membresia[]>("/membresias");

export const getMembresia = (id: number) => api.get<Membresia>(`/membresias/${id}`);

export const createMembresia = (data: Omit<Membresia, "id">) =>
  api.post<Membresia>("/membresias", data);

export const updateMembresia = (id: number, data: Partial<Membresia>) =>
  api.put<Membresia>(`/membresias/${id}`, data);

export const deleteMembresia = (id: number) =>
  api.delete(`/membresias/${id}`);
