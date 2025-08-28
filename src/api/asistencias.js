// src/api/asistenciasApi.js
import { api } from "./apiConfig";

// Obtener todas las asistencias
export const getAsistencias = () => api.get("/asistencias");
export const getAsistencia = (id) => api.get(`/asistencias/${id}`);
export const createAsistencia = (data) => api.post("/asistencias", data);
export const updateAsistencia = (id, data) => api.put(`/asistencias/${id}`, data);
export const deleteAsistencia = (id) => api.delete(`/asistencias/${id}`);
