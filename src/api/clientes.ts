// src/api/clientesApi.ts
import { api } from "./apiConfig";

// Definición de Cliente basada en tu modelo SQLAlchemy
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  id_huella?: number | null;
  fecha_nacimiento: string; 
  telefono?: string | null;
  correo: string;
  direccion?: string | null;
  id_tipo_descuento?: number | 1;
  huella_template?: string | null; 
  fotografia?: string | null;
}

// ---- Paginación genérica ----
export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
  next?: string | null;
  prev?: string | null;
};

export type ClienteSort =
  | "id"
  | "nombre"
  | "apellido"
  | "documento"
  | "correo"
  | "fecha_nacimiento";

export interface PageParams {
  page?: number;          // default lo decides en el caller
  size?: number;          // idem
  q?: string;             // búsqueda
  sort?: ClienteSort;     // "nombre" por defecto en el backend
  order?: "asc" | "desc"; // "asc" por defecto en el backend
}

// ---- API ----

export const getClientes = (params: Record<string, any> = {}) =>
  api.get<Page<Cliente>>("/clientes/", { params });

// Útil si quieres usar los links `next`/`prev` tal cual del backend
export const getClientesByUrl = (url: string) =>
  api.get<Page<Cliente>>(url);

export const getCliente = (id: number) =>
  api.get<Cliente>(`/clientes/${id}`);

export const createCliente = (data: Partial<Cliente>) =>
  api.post<Cliente>("/clientes/", data);

export const updateCliente = (id: number, data: Partial<Cliente>) =>
  api.put<Cliente>(`/clientes/${id}`, data);

export const deleteCliente = (id: number) =>
  api.delete(`/clientes/${id}`);
