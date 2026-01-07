import { Navigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import { ReactNode } from "react";

interface RequireAuthProps {
    children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);

    if (!isAuthenticated || !token) {
        return <Navigate to="/auth/login" replace />;
    }

    return <>{children}</>;
};

export default RequireAuth;
