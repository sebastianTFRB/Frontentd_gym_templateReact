// src/api/sedesApi.js
import { api } from "./apiConfig";

// Obtener todas las sedes
export const getSedes = () => api.get("/sedes");
export const getSede = (id) => api.get(`/sedes/${id}`);
export const createSede = (data) => api.post("/sedes", data);
export const updateSede = (id, data) => api.put(`/sedes/${id}`, data);
export const deleteSede = (id) => api.delete(`/sedes/${id}`);
