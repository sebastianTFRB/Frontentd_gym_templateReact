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

type SavedVolume = { el: HTMLMediaElement; volume: number; muted: boolean };
type YtFrame = { iframe: HTMLIFrameElement; wasMuted?: boolean; prevVolume?: number };

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

  /* =================== 🎚️ DUCKING (baja otras fuentes) =================== */
  const saved: SavedVolume[] = [];
  const ytFrames: YtFrame[] = [];
  const DUCK_VOLUME = 0.05; // volumen de otras fuentes durante la voz

  const duckAllMedia = () => {
    document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((el) => {
      saved.push({ el, volume: el.volume, muted: el.muted });
      if (!el.muted && el.volume > DUCK_VOLUME) el.volume = DUCK_VOLUME;
    });

    document.querySelectorAll<HTMLIFrameElement>("iframe[src*='youtube.com/embed']").forEach((iframe) => {
      try {
        const src = iframe.getAttribute("src") || "";
        if (!src.includes("enablejsapi=1")) return;
        ytFrames.push({ iframe });
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [DUCK_VOLUME * 100] }),
          "*"
        );
      } catch {}
    });
  };

  const restoreAllMedia = () => {
    saved.forEach(({ el, volume, muted }) => {
      try {
        el.volume = volume;
        el.muted = muted;
      } catch {}
    });
    saved.length = 0;

    ytFrames.forEach(({ iframe }) => {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [100] }),
          "*"
        );
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "unMute" }),
          "*"
        );
      } catch {}
    });
    ytFrames.length = 0;
  };

  /* =================== 🔊 REPRODUCCIÓN POTENCIADA =================== */
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const texto = (() => {
      if (!permitido) return `${mensaje}`;

      const partes = [`Bienvenido ${nombre || ""}, a Golden’s Gym.`];

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

      // 🎙️ Voz potente y clara
      const vozPreferida =
        voces.find((v) =>
          /(latino|colombia|mexico|es\-co|google español latinoamericano)/i.test(v.name)
        ) ||
        voces.find((v) => /(helena|sabina|sofia|carla|lucia|monica)/i.test(v.name)) ||
        voces.find((v) => v.lang === "es-CO") ||
        voces.find((v) => v.lang.startsWith("es"));
      utter.voice = vozPreferida || null;

      // 🔊 Configuración para máxima potencia
      utter.volume = 1.0; // máxima potencia
      utter.rate = 0.95; // velocidad natural más grave
      utter.pitch = 1.05; // tono equilibrado

      // 🔉 Ducking durante la voz
      utter.onstart = () => {
        duckAllMedia();
        try {
          new BroadcastChannel("gym-tts-duck").postMessage("DUCK");
        } catch {}
      };

      const restore = () => {
        restoreAllMedia();
        try {
          new BroadcastChannel("gym-tts-duck").postMessage("RESTORE");
        } catch {}
      };

      utter.onend = restore;
      utter.onerror = restore;

      // 🎧 Refuerzo por Web Audio API
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gain = ctx.createGain();
        gain.gain.value = 2.0; // duplicar ganancia
        const src = ctx.createMediaStreamSource(
          (synth as any).destination?.stream || new MediaStream()
        );
        src.connect(gain).connect(ctx.destination);
      } catch (err) {
        console.warn("No se pudo aplicar refuerzo de volumen:", err);
      }

      synth.cancel(); // cancelar cualquier cola
      synth.speak(utter);
    };

    reproducir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, mensaje, permitido, sesionesRestantes, diasRestantes]);

  /* =================== 🎨 UI =================== */
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
        <Card className={`w-96 shadow-2xl border-0 text-white bg-gradient-to-br ${bgColor}`}>
          <div className="flex items-center gap-4">
            {/* FOTO */}
            <div className="relative">
              {foto ? (
                <img
                  src={foto.startsWith("http") ? foto : `${window.location.origin}/${foto}`}
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
                      <span className={sesionesRestantes <= 5 ? "font-bold text-yellow-200" : ""}>
                        {sesionesRestantes}
                      </span>
                    </p>
                  )}
                  {diasRestantes != null && (
                    <p>
                      <strong>Días para vencer:</strong>{" "}
                      <span className={diasRestantes <= 5 ? "font-bold text-yellow-200" : ""}>
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
