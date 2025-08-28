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
