// src/api/facturasApi.js
import { api } from "./apiConfig";

// Obtener todas las facturas
export const getFacturas = () => api.get("/facturas");
export const getFactura = (id) => api.get(`/facturas/${id}`);
export const createFactura = (data) => api.post("/facturas", data);
export const updateFactura = (id, data) => api.put(`/facturas/${id}`, data);
export const deleteFactura = (id) => api.delete(`/facturas/${id}`);
