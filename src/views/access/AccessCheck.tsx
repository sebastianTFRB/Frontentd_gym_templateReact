import { useState, useRef, useEffect } from "react";
import { Card, TextInput, Button } from "flowbite-react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { api } from "../../api/apiConfig";

const AccessCheck = () => {
    const [documento, setDocumento] = useState("");
    const [lastResult, setLastResult] = useState<{ allowed: boolean; msg: string; timestamp: Date } | null>(null);
    const [processing, setProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const MySwal = withReactContent(Swal);

    // Keep focus on input for barcode scanners
    useEffect(() => {
        inputRef.current?.focus();
        const interval = setInterval(() => {
            if (document.activeElement !== inputRef.current) {
                inputRef.current?.focus();
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const speakVoice = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "es-CO";
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang === "es-CO" || v.lang.startsWith("es"));
        if (preferred) utter.voice = preferred;
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
    };

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documento.trim()) return;

        setProcessing(true);
        const docToSend = documento.trim();
        setDocumento("");

        try {
            const res = await api.post("/acceso/verificar-acceso", { documento: docToSend });
            const allowed = res.data.permitido;
            const msg = res.data.mensaje;

            setLastResult({ allowed, msg, timestamp: new Date() });
            speakVoice(msg);

            if (allowed) {
                MySwal.fire({
                    icon: 'success',
                    title: '¡Bienvenido!',
                    text: msg,
                    timer: 2000,
                    showConfirmButton: false,
                    backdrop: `rgba(0,0,0,0.4)`
                });
            } else {
                MySwal.fire({
                    icon: 'error',
                    title: 'Acceso Denegado',
                    text: msg,
                    timer: 3000,
                    showConfirmButton: false,
                    backdrop: `rgba(0,0,0,0.4)`
                });
            }

        } catch (error: any) {
            console.error(error);
            const errMsg = error.response?.data?.detail || "Error de conexión";
            setLastResult({ allowed: false, msg: errMsg, timestamp: new Date() });
            speakVoice("Error en el sistema");
            MySwal.fire({ icon: 'warning', title: 'Error', text: errMsg, timer: 3000, showConfirmButton: false });
        } finally {
            setProcessing(false);
        }
    };

    // Reset result automatically after 5 seconds to show "Ready" state again
    useEffect(() => {
        if (lastResult) {
            const timer = setTimeout(() => setLastResult(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [lastResult]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-2xl z-10">
                {/* Header Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-4">
                        <Icon icon="solar:dumbbells-bold-duotone" className="text-yellow-500" width={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        Golden's<span className="text-yellow-500">Gym</span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Control de Acceso Inteligente</p>
                </div>

                <div className="relative">
                    {/* Main Interaction Card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 p-8 md:p-12 text-center transition-all duration-300">

                        {/* Dynamic Content Switching */}
                        {!lastResult ? (
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-2">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <Icon icon="solar:qr-code-scan-broken" className="text-gray-400" width={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Escanee su carnet</h3>
                                    <p className="text-gray-500">Acerque el código de barras o ingrese su documento</p>
                                </div>

                                <form onSubmit={handleCheck} className="relative max-w-sm mx-auto">
                                    <TextInput
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Esperando lectura..."
                                        value={documento}
                                        onChange={(e) => setDocumento(e.target.value)}
                                        className="text-center font-mono text-lg"
                                        style={{ height: '60px', fontSize: '1.25rem' }}
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    {processing && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Icon icon="line-md:loading-twotone-loop" className="text-yellow-500" width={24} />
                                        </div>
                                    )}
                                </form>
                            </div>
                        ) : (
                            <div className="animate-zoom-in">
                                {/* Result Display */}
                                <div className={`inline-flex p-6 rounded-full mb-6 ${lastResult.allowed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <Icon
                                        icon={lastResult.allowed ? "solar:shield-check-bold" : "solar:shield-warning-bold"}
                                        width={64}
                                        className="drop-shadow-sm"
                                    />
                                </div>
                                <h2 className={`text-3xl font-black mb-2 ${lastResult.allowed ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                                    {lastResult.allowed ? "¡Acceso Permitido!" : "Acceso Denegado"}
                                </h2>
                                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                                    {lastResult.msg}
                                </p>
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col items-center">
                                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Hora de registro</span>
                                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                                        {lastResult.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manual Override Button (Floating at bottom for emergency) */}
                    <div className="mt-8 flex justify-center">
                        <Button
                            color="gray"
                            size="xs"
                            className="bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 border-0 backdrop-blur-sm transition-all"
                            onClick={async () => {
                                try {
                                    const { data } = await api.post("/dispositivos/sede1/puerta1/cmd", {
                                        action: "open_door",
                                        timeout: 5.0,
                                        payload: { timeout_ms: 3000 }
                                    });
                                    if (data.ok) {
                                        MySwal.fire({ toast: true, position: 'top', icon: 'success', title: 'Puerta abierta', showConfirmButton: false, timer: 1500 });
                                    }
                                } catch (e) {
                                    MySwal.fire({ toast: true, position: 'top', icon: 'error', title: 'Error abriendo puerta', showConfirmButton: false, timer: 1500 });
                                }
                            }}
                        >
                            <Icon icon="solar:lock-keyhole-minimalistic-broken" className="mr-2" />
                            Apertura Manual
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessCheck;
