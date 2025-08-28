// src/api/clientesApi.ts
import { api } from "./apiConfig";

// Definición de Cliente basada en tu modelo SQLAlchemy
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  id_huella?: number | null;
  fecha_nacimiento: string; // 👈 en backend es Date, pero llega como string (ISO) en JSON
  telefono?: string | null;
  correo: string;
  direccion?: string | null;
  id_tipo_descuento?: number | null;
  huella_template?: string | null; // 👈 LargeBinary lo manejas como base64/string
  fotografia?: string | null;      // 👈 idem arriba
}

// API CRUD con tipado
export const getClientes = () => api.get<Cliente[]>("/clientes/");
export const getCliente = (id: number) => api.get<Cliente>(`/clientes/${id}`);
export const createCliente = (data: Partial<Cliente>) => api.post<Cliente>("/clientes/", data);
export const updateCliente = (id: number, data: Partial<Cliente>) =>
  api.put<Cliente>(`/clientes/${id}`, data);
export const deleteCliente = (id: number) => api.delete(`/clientes/${id}`);
