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
  {
    heading: "Inicio",
    children: [
      {
        name: "Inicio",
        icon: "solar:home-linear",
        id: uniqueId(),
        url: "/dashboard",
        isPro: false,
      },
    ],
  },

  {
    heading: "Control de Membresías",
    children: [
      {
        name: "Ver Membresías",
        icon: "ph:identification-card-duotone",
        id: uniqueId(),
        url: "/clientes/membresias",
        color: "#FFD54A", // resáltalo en el render (dorado)
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

  {
    heading: "Clientes",
    children: [
      {
        name: "Consultar Cliente",
        icon: "mdi:account-search-outline",
        id: uniqueId(),
        url: "/ClientList",
        isPro: false,
      },
    ],
  },

  {
    heading: "Control de Accesos",
    children: [
      {
        name: "Asistencias",
        icon: "mdi:door-open",   // ✅ icono agregado
        id: uniqueId(),
        url: "/asistencias",
        isPro: false,
      },
    ],
  },

  {
    heading: "Gestor Golden's",
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
];

export default SidebarContent;


 
  //     {
  //       name: "Auth Pages",
  //       icon: "solar:login-2-linear",
  //       id: uniqueId(),
  //       url: "https://matdash-react-tailwind-main.netlify.app/auth/error",
  //       children: [
  //         {
  //           name: "Error",
  //           icon: "solar:bug-minimalistic-line-duotone",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/error",
  //           isPro: true
  //         },
  //         {
  //           name: "Side Login",
  //           icon: "solar:login-3-line-duotone",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth1/login",
  //           isPro: true
  //         },
  //         {
  //           name: "Boxed Login",
  //           icon: "solar:login-3-line-duotone",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth2/login",
  //           isPro: true
  //         },
  //         {
  //           name: "Side Register",
  //           icon: "solar:user-plus-rounded-line-duotone",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth1/register",
  //           isPro: true
  //         },
  //         {
  //           name: "Boxed Register",
  //           icon: "solar:user-plus-rounded-line-duotone",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth2/register",
  //           isPro: true
  //         },
  //         {
  //           name: "Side Forgot Pwd",
  //           icon: "solar:password-outline",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth1/forgot-password",
  //           isPro: true
  //         },
  //         {
  //           name: "Boxed Forgot Pwd",
  //           icon: "solar:password-outline",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth2/forgot-password",
  //           isPro: true
  //         },
  //         {
  //           name: "Side Two Steps",
  //           icon: "solar:password-outline",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth1/two-steps",
  //           isPro: true
  //         },
  //         {
  //           name: "Boxed Two Steps",
  //           icon: "solar:password-outline",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/auth2/two-steps",
  //           isPro: true
  //         },
  //         {
  //           name: "Maintenance",
  //           icon: "solar:settings-outline",
  //           id: uniqueId(),
  //           url: "https://matdash-react-tailwind-main.netlify.app/auth/maintenance",
  //           isPro: true
  //         },
  //       ]
  //     },

  //   ],
  // },

