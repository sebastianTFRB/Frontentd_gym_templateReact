export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  isPro?: boolean;
}

import { uniqueId } from "lodash";

const SidebarContent: MenuItem[] = [
  /* ========== 1) Control de Membresías (prioritario) ========== */
  {
    heading: "Control de Membresías",
    children: [
      {
        name: "Ver Membresías",
        icon: "ph:identification-card-duotone", // destacado
        id: uniqueId(),
        url: "/clientes/membresias",
        color: "#FFD54A", // 👈 úsalo en el render para resaltar (dorado)
        isPro: false,
      },
      {
        name: "Nueva Membresía",
        icon: "solar:add-circle-outline",
        id: uniqueId(),
        url: "/clientes/new-with-membresia",
        isPro: false,
      },
    ],
  },

  /* =========== 2) Control de Accesos =========== */
  {
    heading: "Control de Accesos",
    children: [
      {
        name: "Asistencias",
        icon: "mdi:door-open", // ✅ icono de acceso/puerta
        id: uniqueId(),
        url: "/asistencias",
        isPro: false,
      },
      {
        name: "Consultar Cliente",
        icon: "mdi:account-search-outline",
        id: uniqueId(),
        url: "/ClientList",
        isPro: false,
      },
    ],
  },

  /* ======= 3) Gestor Golden's (comprimido en colapsable) ======= */
  {
    heading: "Gestor Golden's",
    children: [
      {
        name: "Administración",
        icon: "solar:settings-outline",
        id: uniqueId(),
        children: [
          {
            name: "Membresías",
            icon: "material-symbols:card-membership-outline",
            id: uniqueId(),
            url: "/Membresia",
            isPro: false,
          },
          {
            name: "Descuentos",
            icon: "material-symbols:percent-discount-outline",
            id: uniqueId(),
            url: "/TipoDescuento",
            isPro: false,
          },
        ],
      },
    ],
  },
];

export default SidebarContent;
