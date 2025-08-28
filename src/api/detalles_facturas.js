// src/api/detallesFacturasApi.js
import { api } from "./apiConfig";

// Obtener todos los detalles de facturas
export const getDetallesFacturas = () => api.get("/detalles-facturas");
export const getDetalleFactura = (id) => api.get(`/detalles-facturas/${id}`);
export const createDetalleFactura = (data) => api.post("/detalles-facturas", data);
export const updateDetalleFactura = (id, data) => api.put(`/detalles-facturas/${id}`, data);
export const deleteDetalleFactura = (id) => api.delete(`/detalles-facturas/${id}`);
