import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router";
import adminmart_logo from "/src/assets/images/logos/goldens.svg";
import Profile from "./Profile";
import Notification from "./notification";
import { api } from "../../../api/apiConfig";
import { MouseEvent } from "react";


const Topbar: React.FC = () => {
  const deviceId = 1;

  // Función para abrir el dispositivo
  const handleOpenCommand = async (e?: MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    try {
      const response = await api.post(`/dispositivo/dispositivo/${deviceId}/comando`, {
        comando: "open",
        cliente_id: 0,
      });
      console.log("Respuesta:", response.data);
      alert("Comando enviado correctamente ✅");
    } catch (error) {
      console.error("Error al enviar comando:", error);
      alert("Error al enviar comando ❌");
    }
  };

  return (
    <div className="py-[15px] px-6 z-40 sticky top-0 bg-[linear-gradient(90deg,_#000000_0%,_#1a1a1a_100%)]">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="md:flex hidden items-center gap-5">
          <Link to="/" className="flex items-center gap-2">
            <img src={adminmart_logo} alt="logo" width={50} />
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-300 bg-clip-text text-transparent">
              Golden&apos;s Gym
            </span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="flex items-center gap-[10px]">
              {/* Botón que ejecuta el POST */}
              <button
                onClick={handleOpenCommand}
                className="flex items-center px-4 py-[11px] rounded-[4px] gap-2 text-white bg-[#c99700] "
              >
                <Icon icon="material-symbols-light:door-open-outline" width={25} />
                <h4 className="text-base font-normal leading-none text-white">Abrir puerta</h4>
              </button>

              <Notification />
              {/* <Profile /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
