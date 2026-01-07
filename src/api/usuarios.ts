import { api } from "./apiConfig";
import { User } from "../store/authStore"; // Reuse User type or define a new one

// Types
export interface UsuarioCreate {
    nombre_usuario: string;
    correo: string;
    contraseña: string;
    id_rol?: number;
    activo?: boolean;
    id_cliente?: number | null;
}

export interface UsuarioUpdate {
    nombre_usuario?: string;
    correo?: string;
    contraseña?: string;
    id_rol?: number;
    activo?: boolean;
    id_cliente?: number | null;
}

export interface UsuarioSelfUpdate {
    nombre_usuario?: string;
    correo?: string;
    contraseña?: string;
}

// API methods
export const getUsuarios = () => api.get<User[]>("/usuarios");
export const getUsuario = (id: number) => api.get<User>(`/usuarios/${id}`);
export const createUsuario = (data: UsuarioCreate) => api.post<User>("/usuarios", data);
export const updateUsuario = (id: number, data: UsuarioUpdate) => api.put<User>(`/usuarios/${id}`, data);
export const deleteUsuario = (id: number) => api.delete(`/usuarios/${id}`);

// Self methods
export const getMe = () => api.get<User>("/usuarios/me");
export const updateMe = (data: UsuarioSelfUpdate) => api.put<User>("/usuarios/me", data);
