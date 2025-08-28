
import { api } from "./apiConfig";

// Obtener todos los tipos de descuento
export const getTiposDescuento = () => api.get("/tipos-descuento/");
export const getTipoDescuento = (id) => api.get(`/tipos-descuento/${id}`);
export const createTipoDescuento = (data) => api.post("/tipos-descuento/", data);
export const updateTipoDescuento = (id, data) => api.put(`/tipos-descuento/${id}`, data);
export const deleteTipoDescuento = (id) => api.delete(`/tipos-descuento/${id}`);
