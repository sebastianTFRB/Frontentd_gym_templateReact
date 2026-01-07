import { useState, useEffect } from "react";
import { api } from "../../api/apiConfig"; // Ajustar path según ubicación real
import { Button, Label } from "flowbite-react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";

export default function ConfigLuces() {
    const [color, setColor] = useState("#000000");
    const [loading, setLoading] = useState(false);
    const [sede, setSede] = useState("pasto");
    const [device, setDevice] = useState("turnstile-01");

    // Helper: RGB to Hex
    const rgbToHex = (r: number, g: number, b: number) =>
        "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

    // Helper: Hex to RGB
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                red: parseInt(result[1], 16),
                green: parseInt(result[2], 16),
                blue: parseInt(result[3], 16),
            }
            : { red: 0, green: 0, blue: 0 };
    };

    const loadColor = () => {
        // Cargar color según la sede/dispositivo actuales
        api.get(`/config/${sede}/${device}/rgb`)
            .then((res) => {
                const { red, green, blue } = res.data;
                setColor(rgbToHex(red, green, blue));
            })
            .catch((err) => {
                console.error("Error loading color", err);
                // Reset to black on error/not found
                setColor("#000000");
            });
    };

    // Recargar cuando cambian los inputs (podríamos debouncarlo, pero un botón 'Cargar' o efecto simple está bien)
    useEffect(() => {
        const timer = setTimeout(loadColor, 500); // Pequeño debounce al escribir
        return () => clearTimeout(timer);
    }, [sede, device]);

    const handleSave = async () => {
        setLoading(true);
        const payload = hexToRgb(color);
        try {
            await api.post(`/config/${sede}/${device}/rgb`, payload);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: 'success',
                title: 'Luces Actualizadas 💡'
            });
        } catch (error) {
            Swal.fire("Error", "No se pudo guardar la configuración", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 flex justify-center">
            <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full max-w-md break-words overflow-hidden">
                {/* Decorative Background Blob */}
                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>

                <h5 className="card-title mb-4 flex items-center gap-2 relative z-10">
                    <Icon
                        icon="solar:lightbulb-bolt-bold-duotone"
                        className="text-amber-400"
                        width={26}
                    />
                    Configuración LED Gym
                </h5>

                <div className="flex flex-col gap-4 mt-4 relative z-10">

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label value="Sede (ej: pasto)" className="mb-1 block text-xs" />
                            <input
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-dark text-white text-sm py-1.5 focus:ring-primary focus:border-primary"
                                value={sede}
                                onChange={e => setSede(e.target.value)}
                                placeholder="pasto"
                            />
                        </div>
                        <div>
                            <Label value="Dispositivo" className="mb-1 block text-xs" />
                            <input
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-dark text-white text-sm py-1.5 focus:ring-primary focus:border-primary"
                                value={device}
                                onChange={e => setDevice(e.target.value)}
                                placeholder="turnstile-01"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="color-picker" value="Seleccionar Color" className="mb-2 block" />
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-dark p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                            <input
                                id="color-picker"
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-14 w-20 cursor-pointer rounded-lg bg-transparent border-0 p-0"
                            />
                            <div className="flex-1">
                                <p className="text-xs text-dark opacity-70 uppercase font-semibold tracking-wider">
                                    Vista Previa
                                </p>
                                <div
                                    className="h-8 w-full rounded-md shadow-sm border border-gray-200 dark:border-gray-600 mt-1 transition-colors duration-300"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        color="warning"
                        onClick={handleSave}
                        isProcessing={loading}
                        className="w-full shadow-lg hover:brightness-110 transition-all font-bold group"
                    >
                        <span className="group-hover:tracking-widest transition-all duration-300">
                            {loading ? "Enviando..." : "ACTIVAR LUCES"}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
