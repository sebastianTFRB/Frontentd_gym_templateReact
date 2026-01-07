import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../api/apiConfig';

// Define types based on backend response
export interface Role {
    id: number;
    nombre_rol: string;
    descripcion?: string;
}

export interface User {
    id: number;
    nombre_usuario: string;
    nombre_completo?: string;
    activo: boolean;
    rol?: Role; // "rol" matching backend Pydantic model
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;

    // Actions
    setToken: (token: string) => void;
    setUser: (user: User) => void;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    fetchUserMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,

            setToken: (token: string) => set({ token, isAuthenticated: !!token }),
            setUser: (user: User) => set({ user }),

            login: async (username, password) => {
                // Form data for OAuth2
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);

                try {
                    const response = await api.post('/auth/login', formData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    });

                    const { access_token } = response.data;
                    set({ token: access_token, isAuthenticated: true });

                    // After login, fetch user details
                    await get().fetchUserMe();

                } catch (error) {
                    console.error("Login failed:", error);
                    throw error;
                }
            },

            fetchUserMe: async () => {
                const token = get().token;
                if (!token) return;

                try {
                    // Token will be attached by interceptor (we will configure it next)
                    const response = await api.get('/usuarios/me');
                    set({ user: response.data });
                } catch (error) {
                    console.error("Failed to fetch user:", error);
                    // If 401, maybe logout?
                    set({ token: null, isAuthenticated: false, user: null });
                }
            },

            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
                // Optional: redirect to login handled by router
                window.location.href = '/auth/login';
            },
        }),
        {
            name: 'auth-storage', // name of item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
