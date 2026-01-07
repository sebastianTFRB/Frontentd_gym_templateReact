import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router";
import adminmart_logo from "/src/assets/images/logos/goldens.svg";
import Notification from "./notification";
import Profile from "./Profile";
import { api } from "../../../api/apiConfig";
import { MouseEvent } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Topbar: React.FC = () => {
  const MySwal = withReactContent(Swal);

  /* ======================== 🔊 Función de voz (Mejorada) ======================== */
  const speakWelcome = (texto: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const reproducir = () => {
      const voces = synth.getVoices();
      if (!voces.length) return setTimeout(reproducir, 200);

      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = "es-CO";

      // 🎙️ Voz potente y clara (Lógica de GymNotification)
      const vozPreferida =
        voces.find((v) =>
          /(latino|colombia|mexico|es\-co|google español latinoamericano)/i.test(v.name)
        ) ||
        voces.find((v) => /(helena|sabina|sofia|carla|lucia|monica)/i.test(v.name)) ||
        voces.find((v) => v.lang === "es-CO") ||
        voces.find((v) => v.lang.startsWith("es"));
      utter.voice = vozPreferida || null;

      utter.volume = 1.0;
      utter.rate = 0.95;
      utter.pitch = 1.05;

      // 🟡 Ducking simple (local)
      const duckingElements = document.querySelectorAll<HTMLMediaElement>("audio, video");
      const prevVolumes: number[] = [];
      duckingElements.forEach((el) => {
        prevVolumes.push(el.volume);
        el.volume = Math.min(el.volume, 0.1);
      });

      const restore = () => {
        duckingElements.forEach((el, i) => (el.volume = prevVolumes[i]));
      };

      utter.onend = restore;
      utter.onerror = restore;

      // 🎧 Refuerzo por Web Audio API (Boost de volumen)
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gain = ctx.createGain();
        gain.gain.value = 2.0; // duplicar ganancia
        const src = ctx.createMediaStreamSource(
          (synth as any).destination?.stream || new MediaStream()
        );
        src.connect(gain).connect(ctx.destination);
      } catch (err) {
        // Ignorar si falla el boost, seguirá sonando normal
      }

      synth.cancel();
      synth.speak(utter);
    };

    reproducir();
  };

  /* ======================== 🚪 Abrir puerta ======================== */
  const handleOpenCommand = async (e?: MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();

    // 🔊 Ejecutar sonido INMEDIATAMENTE (Optimistic UI)
    // Esto evita bloqueos del navegador y asegura feedback auditivo
    speakWelcome("Bienvenido a Golden’s Gym");

    try {
      const response = await api.post("/dispositivos/pasto/turnstile-01/cmd", {
        action: "open_door",
        cliente_id: 0,
        id_huella: 0,
        payload: {
          timeout_ms: 3500
        },
        timeout: 0
      });
      console.log("Respuesta:", response.data);

      if (response.data.ok) {
        // 🎉 Mostrar popup visual tipo toast
        MySwal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Puerta abierta",
          text: "Bienvenido a Golden’s Gym 💪",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "linear-gradient(135deg, #000000, #1a1a1a)",
          color: "#FFD54A",
          customClass: {
            popup: "shadow-lg rounded-lg border border-[#FFD54A]/40",
            title: "text-lg font-semibold text-[#FFD54A]",
            timerProgressBar: "bg-[#FFD54A]",
          },
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });
      } else {
        throw new Error("Dispositivo no confirmó apertura (Timeout)");
      }
    } catch (error) {
      console.error("Error al enviar comando:", error);
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Error al enviar comando",
        text: "No se pudo comunicar con el dispositivo",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#400",
        color: "#fff",
      });
    }
  };

  /* ======================== 🧱 UI ======================== */
  return (
    <div className="py-[15px] px-6 z-40 sticky top-0 bg-[linear-gradient(90deg,_#000000_0%,_#1a1a1a_100%)]">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* LOGO */}
        <div className="md:flex hidden items-center gap-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={adminmart_logo} alt="logo" width={50} />
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-300 bg-clip-text text-transparent">
              Golden&apos;s Gym
            </span>
          </Link>
        </div>

        {/* CONTROLES */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="flex items-center gap-[10px]">
              {/* 🟡 Botón principal */}
              <button
                onClick={handleOpenCommand}
                className="group relative overflow-hidden flex items-center justify-center px-6 py-2.5 rounded-xl gap-2 text-white
                           bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600
                           hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500
                           shadow-[0_4px_20px_rgba(251,191,36,0.4)]
                           hover:shadow-[0_4px_25px_rgba(251,191,36,0.6)]
                           transform hover:-translate-y-0.5 transition-all duration-300 ease-out border border-yellow-300/30"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-300" />
                <Icon icon="solar:door-open-bold-duotone" width={24} className="relative z-10" />
                <span className="relative z-10 text-sm font-bold uppercase tracking-wider text-shadow-sm">
                  Abrir puerta
                </span>
              </button>

              {/* Notificaciones */}
              <Notification />
              {/* Perfil / Logout */}
              <Profile />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
