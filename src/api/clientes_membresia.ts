import { api } from "./apiConfig";

export interface ClienteIn {
  nombre: string;
  apellido: string;
  documento: string;
  fecha_nacimiento?: string; // "YYYY-MM-DD"
  correo?: string;
  telefono?: string;
  direccion?: string;
  fotografia?: string;     // aquí mandas la RUTA (opfs:fotos/123.jpg o "")
  huella_base64?: string;  // envías ""
}

export type EstadoMembresia = "activa" | "vencida" | "sin_membresia";

export interface VentaIn {
  id_membresia: number;
  fecha_inicio?: string;  // "YYYY-MM-DD"
  fecha_fin?: string;     // "YYYY-MM-DD"
  precio_final?: number;
  sesiones_restantes?: number;
  estado?: EstadoMembresia;
}

export interface ClienteMembresiaPayload {
  cliente: ClienteIn;
  venta: VentaIn;
}

// Asegúrate de NO duplicar /api/v1 en la ruta si apiConfig.baseURL ya lo tiene
export function createClienteConMembresia(payload: ClienteMembresiaPayload) {
  return api.post("/clientes/with-membresia", payload);
}
