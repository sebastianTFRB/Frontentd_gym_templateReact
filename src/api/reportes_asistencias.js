// src/api/reportesAsistenciaApi.js
import { api } from "./apiConfig";

// Obtener todos los reportes
export const getReportesAsistencia = () => api.get("/reportes-asistencia");
export const getReporteAsistencia = (id) => api.get(`/reportes-asistencia/${id}`);
export const createReporteAsistencia = (data) => api.post("/reportes-asistencia", data);
export const updateReporteAsistencia = (id, data) => api.put(`/reportes-asistencia/${id}`, data);
export const deleteReporteAsistencia = (id) => api.delete(`/reportes-asistencia/${id}`);
