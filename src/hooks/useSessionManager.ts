import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export const useSessionManager = () => {
    const { loginTime, logout, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated || !loginTime) return;

        const checkSession = () => {
            const currentTime = Date.now();
            const timeElapsed = currentTime - loginTime;

            if (timeElapsed >= EIGHT_HOURS_MS) {
                Swal.fire({
                    title: 'Sesión Expirada',
                    text: 'Tu sesión de 8 horas ha terminado. Por favor, inicia sesión de nuevo.',
                    icon: 'warning',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false,
                }).then(() => {
                    logout();
                });
            }
        };

        // Check immediately on mount
        checkSession();

        // Check every minute
        const intervalId = setInterval(checkSession, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [isAuthenticated, loginTime, logout]);
};
