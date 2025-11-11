import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router";
import adminmart_logo from "/src/assets/images/logos/goldens.svg";
import Notification from "./notification";
import { api } from "../../../api/apiConfig";
import { MouseEvent } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Topbar: React.FC = () => {
  const deviceId = 1;
  const MySwal = withReactContent(Swal);

  /* ======================== 🔊 Función de voz ======================== */
  const speakWelcome = (texto: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const reproducir = () => {
      const voces = synth.getVoices();
      if (!voces.length) return setTimeout(reproducir, 200);

      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = "es-CO";

      // 🎙️ Prioridad de voces latinoamericanas o españolas suaves
      const vozPreferida =
        voces.find((v) =>
          /(es\-co|latino|mexico|colombia|google español latinoamericano)/i.test(v.name)
        ) ||
        voces.find((v) => /(helena|sabina|sofia|carla|lucia|monica)/i.test(v.name)) ||
        voces.find((v) => v.lang === "es-CO") ||
        voces.find((v) => v.lang.startsWith("es"));
      utter.voice = vozPreferida || null;

      utter.rate = 1.02;
      utter.pitch = 1.05;

      // 🟡 Bajar volumen de otras fuentes locales mientras habla
      const duckingElements = document.querySelectorAll<HTMLMediaElement>("audio, video");
      const prevVolumes: number[] = [];
      duckingElements.forEach((el) => {
        prevVolumes.push(el.volume);
        el.volume = Math.min(el.volume, 0.1);
      });

      utter.onend = () => {
        duckingElements.forEach((el, i) => (el.volume = prevVolumes[i]));
      };

      synth.cancel();
      synth.speak(utter);
    };

    reproducir();
  };

  /* ======================== 🚪 Abrir puerta ======================== */
  const handleOpenCommand = async (e?: MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    try {
      const response = await api.post(`/dispositivo/dispositivo/${deviceId}/comando`, {
        comando: "open",
        cliente_id: 0,
      });
      console.log("Respuesta:", response.data);

      // 🔊 Reproducir voz con nombre del gimnasio
      speakWelcome("Bienvenido a Golden’s Gym");

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
                className="flex items-center px-4 py-[11px] rounded-[6px] gap-2 text-white bg-gradient-to-r from-yellow-600 to-yellow-700 hover:brightness-110 transition-all shadow-lg"
              >
                <Icon icon="material-symbols-light:door-open-outline" width={25} />
                <h4 className="text-base font-medium leading-none text-white">
                  Abrir puerta
                </h4>
              </button>

              {/* Notificaciones */}
              <Notification />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
