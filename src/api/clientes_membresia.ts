// src/api/clientes_membresia.ts
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
  huella_base64?: string;
  id_tipo_descuento?: number | 1;  // envías ""
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

/* ====== ACTUALIZACIÓN (forma que exige tu backend) ====== */
// El back espera que mandes el id del cliente dentro del objeto cliente,
// y en venta tanto el id de la venta como el id_cliente.
export interface ClienteUpdateFull {
  id: number;
  nombre?: string;
  apellido?: string;
  documento?: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
  correo?: string;
  telefono?: string;
  direccion?: string;
  id_huella?: number | null;
  id_tipo_descuento?: number | 1;
  // fotografia?: string; // si en algún momento decides actualizar la ruta
  huella_base64?: string; // normalmente vacío
}

export interface VentaUpdateFull {
  id: number;                // id de la venta a editar
  id_cliente: number;        // = id del cliente
  id_membresia: number;
  fecha_inicio?: string;     // YYYY-MM-DD
  fecha_fin?: string;        // YYYY-MM-DD
  precio_final?: number;
  sesiones_restantes?: number;
  estado?: EstadoMembresia;
}

export interface ActualizarClienteYVentaRequest {
  cliente: ClienteUpdateFull;
  venta: VentaUpdateFull;
}

/* ====== ENDPOINTS ====== */

// CREATE: asegúrate que apiConfig.baseURL ya tenga /api/v1
export function createClienteConMembresia(payload: ClienteMembresiaPayload) {
  console.log(payload);
  return api.post("/clientes/with-membresia", payload);
}

// UPDATE: tu ruta real es /api/v1/clientes/{id}/with-membresia (doble 'clientes')
export const updateClienteConMembresia = (
  clienteId: number,
  payload: ActualizarClienteYVentaRequest
) => api.put(`/clientes/${clienteId}/with-membresia`, payload);
