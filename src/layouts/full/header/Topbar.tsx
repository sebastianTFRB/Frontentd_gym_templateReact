import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router";
import { Dropdown } from "flowbite-react/components/Dropdown";
import Profile from "./Profile";
import Notification from "./notification";
import { api } from "../../../api/apiConfig";
import { MouseEvent } from "react";

import img1 from "src/assets/images/svgs/react-cat-icon.svg";
import img2 from "src/assets/images/svgs/angular-cat-icon.svg";
import img3 from "src/assets/images/svgs/vue-cat-icon.svg";
import img4 from "src/assets/images/svgs/nuxt-cat-icon.svg";
import img5 from "src/assets/images/svgs/next-cat-icon.svg";
import img6 from "src/assets/images/svgs/bt-cat-icon.svg";

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

  const dropdownItems = [
    { id: 1, img: img1, title: "React Version", href: "https://adminmart.com/product/matdash-tailwind-react-admin-template/?ref=56#product-demo-section" },
    { id: 2, img: img2, title: "Angular Version", href: "https://adminmart.com/product/matdash-material-angular-dashboard-template/?ref=56#product-demo-section" },
    { id: 3, img: img3, title: "Vuejs Version", href: "https://adminmart.com/product/matdash-vuejs-admin-dashboard/?ref=56#product-demo-section" },
    { id: 4, img: img4, title: "Nuxtjs Version", href: "https://adminmart.com/product/matdash-vuetify-nuxt-js-admin-template/?ref=56#product-demo-section" },
    { id: 5, img: img5, title: "NextJs Version", href: "https://adminmart.com/product/matdash-next-js-admin-dashboard-template/?ref=56#product-demo-section" },
    { id: 6, img: img6, title: "Bootstrap Version", href: "https://adminmart.com/product/matdash-bootstrap-5-admin-dashboard-template/?ref=56#product-demo-section" },
  ];

  return (
    <div className="py-[15px] px-6 z-40 sticky top-0 bg-[linear-gradient(90deg,_#000000_0%,_#1a1a1a_100%)]">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="md:flex hidden items-center gap-5">
          <Link to="/" className="flex items-center gap-2">
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
                className="flex items-center px-4 py-[11px] rounded-[4px] gap-2 text-white bg-[#c99700] hover:bg-[#5d87ff]"
              >
                <Icon icon="mdi:unlocked-outline" width={18} />
                <h4 className="text-base font-normal leading-none text-white">Abrir puerta</h4>
              </button>

              <Notification />
              <Profile />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
