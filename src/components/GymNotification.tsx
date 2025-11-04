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
  // 🕒 Cierre automático
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  // 🔊 Voz en español colombiano / latino
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const texto = (() => {
      if (!permitido) return `Acceso denegado, ${nombre}. ${mensaje}`;

      const partes = [`Bienvenido, ${nombre}.`];

      if (sesionesRestantes === 1) partes.push("Esta es tu última sesión.");
      else if (sesionesRestantes && sesionesRestantes <= 5)
        partes.push(`Te quedan ${sesionesRestantes} sesiones.`);

      if (diasRestantes && diasRestantes <= 5) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + diasRestantes);
        partes.push(
          `Tu membresía vence el ${fecha.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
          })}.`
        );
      }

      if (partes.length === 1) partes.push("Acceso permitido.");
      return partes.join(" ");
    })();

    const reproducir = () => {
      const voces = synth.getVoices();
      if (!voces.length) return setTimeout(reproducir, 200);

      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = "es-CO";

      // 🎤 Prioridad de voces: Google Latinoamericana → Microsoft Helena / Sabina → cualquier “es-CO”
      const vozPreferida =
        voces.find((v) =>
          /(es\-co|latino|mexico|colombia|google español latinoamericano)/i.test(
            v.name
          )
        ) ||
        voces.find((v) =>
          /(helena|sabina|sofia|carla|lucia)/i.test(v.name)
        ) ||
        voces.find((v) => v.lang === "es-CO") ||
        voces.find((v) => v.lang.startsWith("es"));

      utter.voice = vozPreferida || null;

      // 🔉 Ajustes según tipo
      if (!permitido) {
        utter.rate = 0.9;
        utter.pitch = 0.9;
      } else if (
        (diasRestantes && diasRestantes <= 5) ||
        (sesionesRestantes && sesionesRestantes <= 5)
      ) {
        utter.rate = 1.0;
        utter.pitch = 1.0;
      } else {
        utter.rate = 1.05;
        utter.pitch = 1.1;
      }

      synth.cancel();
      synth.speak(utter);
    };

    reproducir();
  }, [nombre, mensaje, permitido, sesionesRestantes, diasRestantes]);

  // 🎨 Colores e íconos
  const advertencia =
    (diasRestantes != null && diasRestantes <= 5) ||
    (sesionesRestantes != null && sesionesRestantes <= 5);

  let bgColor = "from-green-500/90 to-green-700/90";
  let Icon = CheckCircle2;

  if (!permitido) {
    bgColor = "from-red-500/90 to-red-700/90";
    Icon = XCircle;
  } else if (advertencia) {
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
