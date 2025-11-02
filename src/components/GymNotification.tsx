import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "flowbite-react";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

interface Props {
  nombre: string;
  mensaje: string;
  hora?: string;
  foto?: string;
  permitido?: boolean;
  tipoMembresia?: string | null;
  sesionesRestantes?: number | null;
  diasRestantes?: number | null;
  onClose?: () => void;
}

export function GymNotification({
  nombre,
  mensaje,
  hora,
  foto,
  permitido = true,
  tipoMembresia,
  sesionesRestantes,
  diasRestantes,
  onClose,
}: Props) {
  // 🔹 Cierre automático a los 6 segundos
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // 🔊 VOZ dinámica según estado del cliente
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    let texto = "";

    if (!permitido) {
      // ❌ ACCESO DENEGADO
      texto = `${nombre}. ${mensaje}`;
    } else {
      // ✅ ACCESO PERMITIDO
      const partes: string[] = [`Bienvenido, ${nombre}.`];

      // 🔸 Última sesión
      if (sesionesRestantes === 1) {
        partes.push("Esta es tu última sesión.");
      }
      // 🔸 Pocas sesiones
      else if (sesionesRestantes !== null && sesionesRestantes <= 5) {
        partes.push(`Te quedan ${sesionesRestantes} sesiones.`);
      }

      // 🔸 Membresía próxima a vencer
      if (diasRestantes !== null && diasRestantes <= 5) {
        const hoy = new Date();
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(hoy.getDate() + diasRestantes);
        const fechaFormateada = fechaVencimiento.toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
        });
        partes.push(`Tu membresía vence el ${fechaFormateada}.`);
      }

      // 🔸 Si no hay advertencias
      if (partes.length === 1) partes.push("Acceso permitido.");

      texto = partes.join(" ");
    }

    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "es-CO";
    utter.rate = permitido ? 1.05 : 0.95; // un poco más pausado si es denegado
    utter.pitch = permitido ? 1.1 : 0.9; // tono más cálido si es acceso permitido
    utter.volume = 1;

    synth.cancel();
    synth.speak(utter);
  }, [nombre, permitido, mensaje, sesionesRestantes, diasRestantes]);

  // 🔹 Determinar color según estado
  let bgColor = "from-green-500/90 to-green-700/90";
  let Icon = CheckCircle2;

  if (!permitido) {
    bgColor = "from-red-500/90 to-red-700/90";
    Icon = XCircle;
  } else if (
    (diasRestantes !== null && diasRestantes <= 5) ||
    (sesionesRestantes !== null && sesionesRestantes <= 5)
  ) {
    bgColor = "from-amber-400/90 to-amber-600/90";
    Icon = AlertTriangle;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.4 }}
        className="fixed bottom-5 right-5 z-[9999]"
      >
        <Card
          className={`w-96 shadow-2xl border-0 text-white bg-gradient-to-br ${bgColor}`}
        >
          <div className="flex items-center gap-4">
            {/* FOTO */}
            <div className="relative">
              {foto ? (
                <img
                  src={
                    foto.startsWith("http")
                      ? foto
                      : `${window.location.origin}/${foto}`
                  }
                  alt="Foto del cliente"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white/50 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon size={32} className="text-white/80" />
                </div>
              )}
            </div>

            {/* TEXTO */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={22} className="text-white drop-shadow" />
                <p className="font-bold text-lg leading-tight">{nombre}</p>
              </div>
              <p className="text-sm text-white/90 leading-snug">{mensaje}</p>

              {permitido && (
                <div className="mt-1 text-xs text-white/80 space-y-1">
                  {tipoMembresia && (
                    <p>
                      <strong>Membresía:</strong> {tipoMembresia}
                    </p>
                  )}
                  {sesionesRestantes != null && (
                    <p>
                      <strong>Sesiones restantes:</strong>{" "}
                      <span
                        className={
                          sesionesRestantes <= 5
                            ? "font-bold text-yellow-200"
                            : ""
                        }
                      >
                        {sesionesRestantes}
                      </span>
                    </p>
                  )}
                  {diasRestantes != null && (
                    <p>
                      <strong>Días para vencer:</strong>{" "}
                      <span
                        className={
                          diasRestantes <= 5 ? "font-bold text-yellow-200" : ""
                        }
                      >
                        {diasRestantes}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {hora && (
                <div className="mt-2 flex items-center text-xs text-white/70">
                  <Clock size={14} className="me-1" />
                  {hora}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
