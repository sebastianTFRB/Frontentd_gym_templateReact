// src/api/membresiasApi.js
import { api } from "./apiConfig";

// Obtener todas las membresías
export const getMembresias = () => api.get("/membresias");
export const getMembresia = (id) => api.get(`/membresias/${id}`);
export const createMembresia = (data) => api.post("/membresias", data);
export const updateMembresia = (id, data) => api.put(`/membresias/${id}`, data);
export const deleteMembresia = (id) => api.delete(`/membresias/${id}`);
