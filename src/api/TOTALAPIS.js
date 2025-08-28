// src/api/asistenciasApi.js
import { api } from "./apiConfig";

// Obtener todas las asistencias
export const getAsistencias = () => api.get("/asistencias");
export const getAsistencia = (id) => api.get(`/asistencias/${id}`);
export const createAsistencia = (data) => api.post("/asistencias", data);
export const updateAsistencia = (id, data) => api.put(`/asistencias/${id}`, data);
export const deleteAsistencia = (id) => api.delete(`/asistencias/${id}`);

// src/api/clientesApi.js
import { api } from "./apiConfig";

// Obtener todos los clientes
export const getClientes = () => api.get("/clientes");
export const getCliente = (id) => api.get(`/clientes/${id}`);
export const createCliente = (data) => api.post("/clientes", data);
export const updateCliente = (id, data) => api.put(`/clientes/${id}`, data);
export const deleteCliente = (id) => api.delete(`/clientes/${id}`);

// src/api/detallesFacturasApi.js
import { api } from "./apiConfig";

// Obtener todos los detalles de facturas
export const getDetallesFacturas = () => api.get("/detalles-facturas");
export const getDetalleFactura = (id) => api.get(`/detalles-facturas/${id}`);
export const createDetalleFactura = (data) => api.post("/detalles-facturas", data);
export const updateDetalleFactura = (id, data) => api.put(`/detalles-facturas/${id}`, data);
export const deleteDetalleFactura = (id) => api.delete(`/detalles-facturas/${id}`);

// src/api/facturasApi.js
import { api } from "./apiConfig";

// Obtener todas las facturas
export const getFacturas = () => api.get("/facturas");
export const getFactura = (id) => api.get(`/facturas/${id}`);
export const createFactura = (data) => api.post("/facturas", data);
export const updateFactura = (id, data) => api.put(`/facturas/${id}`, data);
export const deleteFactura = (id) => api.delete(`/facturas/${id}`);

// src/api/membresiasApi.js
import { api } from "./apiConfig";

// Obtener todas las membresías
export const getMembresias = () => api.get("/membresias");
export const getMembresia = (id) => api.get(`/membresias/${id}`);
export const createMembresia = (data) => api.post("/membresias", data);
export const updateMembresia = (id, data) => api.put(`/membresias/${id}`, data);
export const deleteMembresia = (id) => api.delete(`/membresias/${id}`);

// src/api/reportesAsistenciaApi.js
import { api } from "./apiConfig";

// Obtener todos los reportes
export const getReportesAsistencia = () => api.get("/reportes-asistencia");
export const getReporteAsistencia = (id) => api.get(`/reportes-asistencia/${id}`);
export const createReporteAsistencia = (data) => api.post("/reportes-asistencia", data);
export const updateReporteAsistencia = (id, data) => api.put(`/reportes-asistencia/${id}`, data);
export const deleteReporteAsistencia = (id) => api.delete(`/reportes-asistencia/${id}`);

// src/api/rolesApi.js
import { api } from "./apiConfig";

// Obtener todos los roles
export const getRoles = () => api.get("/roles");
export const getRol = (id) => api.get(`/roles/${id}`);
export const createRol = (data) => api.post("/roles", data);
export const updateRol = (id, data) => api.put(`/roles/${id}`, data);
export const deleteRol = (id) => api.delete(`/roles/${id}`);

// src/api/sedesApi.js
import { api } from "./apiConfig";

// Obtener todas las sedes
export const getSedes = () => api.get("/sedes");
export const getSede = (id) => api.get(`/sedes/${id}`);
export const createSede = (data) => api.post("/sedes", data);
export const updateSede = (id, data) => api.put(`/sedes/${id}`, data);
export const deleteSede = (id) => api.delete(`/sedes/${id}`);

// src/api/tipoDescuentoApi.js
import { api } from "./apiConfig";

// Obtener todos los tipos de descuento
export const getTiposDescuento = () => api.get("/tipos_descuento");
export const getTipoDescuento = (id) => api.get(`/tipos_descuento/${id}`);
export const createTipoDescuento = (data) => api.post("/tipos_descuento", data);
export const updateTipoDescuento = (id, data) => api.put(`/tipos_descuento/${id}`, data);
export const deleteTipoDescuento = (id) => api.delete(`/tipos_descuento/${id}`);


import { api } from "./apiConfig";

// Obtener todos los usuarios
export const getUsuarios = () => api.get("/usuarios");
export const getUsuario = (id) => api.get(`/usuarios/${id}`);
export const createUsuario = (data) => api.post("/usuarios", data);
export const updateUsuario = (id, data) => api.put(`/usuarios/${id}`, data);
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);

// src/api/ventaMembresiaApi.js
import { api } from "./apiConfig";

// Obtener todas las ventas
export const getVentasMembresia = () => api.get("/ventas-membresia");
export const getVentaMembresia = (id) => api.get(`/ventas-membresia/${id}`);
export const createVentaMembresia = (data) => api.post("/ventas-membresia", data);
export const updateVentaMembresia = (id, data) => api.put(`/ventas-membresia/${id}`, data);
export const deleteVentaMembresia = (id) => api.delete(`/ventas-membresia/${id}`);
