// src/api/apiConfig.ts
import axios, { AxiosInstance } from "axios";

export const API_BASE_URL = "http://localhost:8000/api/v1";
// Instancia de Axios con tipado
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token
api.interceptors.request.use(
  (config) => {
    // Importación dinámica o acceso directo al store
    // Nota: Evitar importación circular si apiConfig se usa en el store.
    // Usamos localStorage directamente o importamos el store si no hay ciclo.
    // Como apiConfig se usa en el store, lo mejor es leer del storage persistido o inyectarlo.

    // Opción A: Leer de localStorage (si usamos persist con nombre 'auth-storage')
    const storageItem = localStorage.getItem('auth-storage');
    if (storageItem) {
      const { state } = JSON.parse(storageItem);
      if (state && state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
