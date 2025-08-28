// src/api/ventaMembresiaApi.js
import { api } from "./apiConfig";

const BASE_URL = "/ventas-membresias/";

// Obtener todas las ventas
export const getVentasMembresia = () => api.get(BASE_URL);
export const getVentaMembresia = (id) => api.get(`${BASE_URL}${id}/`);
export const createVentaMembresia = (data) => api.post(BASE_URL, data);
export const updateVentaMembresia = (id, data) =>
  api.put(`${BASE_URL}${id}/`, data);

export const deleteVentaMembresia = (id) =>
  api.delete(`${BASE_URL}${id}/`);
