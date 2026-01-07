import { useEffect, useState } from "react";
import { Button, Label, TextInput, Alert, Spinner } from "flowbite-react";
import { useAuthStore } from "../../store/authStore";
import { updateMe, getMe, UsuarioSelfUpdate } from "../../api/usuarios";
import { Icon } from "@iconify/react";

const MyProfile = () => {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    // State for basic info form
    const [nombreUsuario, setNombreUsuario] = useState("");


    // State for password form
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'failure', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setNombreUsuario(user.nombre_usuario || "");
            // setCorreo(user.correo || ""); // Assuming 'correo' is part of user object (check store type)
        } else {
            // Fetch keys if missing or refreshing page
            fetchUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        try {
            const res = await getMe();
            setUser(res.data);
            setNombreUsuario(res.data.nombre_usuario);
            // setCorreo(res.data.correo); // Need to Ensure User interface has correo
        } catch (error) {
            console.error("Error loading user data", error);
        }
    }

    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const payload: UsuarioSelfUpdate = {};
        if (nombreUsuario !== user?.nombre_usuario) payload.nombre_usuario = nombreUsuario;
        // if (correo !== user?.correo) payload.correo = correo; // Add logic if correo is editable

        if (Object.keys(payload).length === 0) {
            setLoading(false);
            return;
        }

        try {
            const res = await updateMe(payload);
            setUser(res.data); // Update store
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        } catch (error: any) {
            setMessage({ type: 'failure', text: error.response?.data?.detail || 'Error al actualizar perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (password !== confirmPassword) {
            setMessage({ type: 'failure', text: 'Las contraseñas no coinciden' });
            return;
        }
        if (!password) return;

        setLoading(true);
        try {
            await updateMe({ contraseña: password });
            setPassword("");
            setConfirmPassword("");
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
        } catch (error: any) {
            setMessage({ type: 'failure', text: error.response?.data?.detail || 'Error al actualizar contraseña' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="flex justify-center p-10"><Spinner /></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">

            {/* User Info Card */}
            <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
                <h5 className="card-title mb-4">
                    Mi Perfil
                </h5>
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Icon icon="solar:user-circle-bold" height={40} />
                    </div>
                    <div>
                        <h6 className="text-lg font-bold">{user.nombre_usuario}</h6>
                        <p className="text-sm text-dark opacity-70">{user.rol?.nombre_rol || "Usuario"}</p>
                    </div>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleUpdateInfo}>
                    <div>
                        <div className="mb-2 block"><Label htmlFor="username" value="Nombre de Usuario" /></div>
                        <TextInput id="username" type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} required />
                    </div>

                    <Button type="submit" color="primary" isProcessing={loading} disabled={loading}>
                        Actualizar Datos
                    </Button>
                </form>
            </div>

            {/* Change Password Card */}
            <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
                <h5 className="card-title mb-4">
                    Cambiar Contraseña
                </h5>
                <form className="flex flex-col gap-4" onSubmit={handleUpdatePassword}>
                    <div>
                        <div className="mb-2 block"><Label htmlFor="new-password" value="Nueva Contraseña" /></div>
                        <TextInput id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div>
                        <div className="mb-2 block"><Label htmlFor="confirm-password" value="Confirmar Contraseña" /></div>
                        <TextInput id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                    </div>

                    <Button type="submit" color="dark" isProcessing={loading} disabled={loading}>
                        Actualizar Contraseña
                    </Button>
                </form>

                {message && (
                    <Alert color={message.type} className="mt-4">
                        {message.text}
                    </Alert>
                )}
            </div>
        </div>
    );
};

export default MyProfile;
