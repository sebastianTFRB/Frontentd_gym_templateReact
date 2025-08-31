import type { Config } from "tailwindcss";
const flowbite = require("flowbite-react/tailwind");

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content(), // Flowbite
  ],
  theme: {
    fontFamily: {
      sans: ["Manrope", "system-ui", "serif"],
    },
    extend: {
      /* ====== Golden’s palette & effects ====== */
      colors: {
        // Paleta propia para usar cuando quieras (bg-brand-gold-500, text-brand-gold-600, etc.)
        brand: {
          dark: "#0b0b0c",
          dark2: "#111214",
          gold: {
            50:  "#FFF8E1",
            100: "#FCEFC7",
            200: "#F7E3A3",
            300: "#F1D47B",
            400: "#E7C157",
            500: "#D4AF37", // DORADO base
            600: "#B88A2C",
            700: "#936F19",
            800: "#6E5210",
            900: "#4A370B",
          },
        },

        /* === Mantengo tu sistema por variables === */
        cyan: {
          "500": "var(--color-primary)",
          "600": "var(--color-primary)",
          "700": "var(--color-primary)",
        },
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        info: "var(--color-info)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        lightprimary: "var(--color-lightprimary)",
        lightsecondary: "var(--color-lightsecondary)",
        lightsuccess: "var( --color-lightsuccess)",
        lighterror: "var(--color-lighterror)",
        lightinfo: "var(--color-lightinfo)",
        lightwarning: "var(--color-lightwarning)",
        border: "var(--color-border)",
        bordergray: "var(--color-bordergray)",
        lightgray: "var( --color-lightgray)",
        muted: "var(--color-muted)",
        lighthover: "var(--color-lighthover)",
        surface: "var(--color-surface-ld)",
        sky: "var(--color-sky)",
        bodytext: "var(--color-bodytext)",
        dark: "var(--color-dark)",
        link: "var(--color-link)",
        darklink: "var(--color-darklink)",
        darkborder: "var(--color-darkborder)",
        darkgray: "var(--color-darkgray)",
        primaryemphasis: "var(--color-primary-emphasis)",
        secondaryemphasis: "var(--color-secondary-emphasis)",
        warningemphasis: "var(--color-warning-emphasis)",
        erroremphasis: "var(--color-error-emphasis)",
        successemphasis: "var(--color-success-emphasis)",
        infoemphasis: "var(--color-info-emphasis)",
        darkmuted: "var( --color-darkmuted)",
      },

      boxShadow: {
        md: "0px 2px 4px -1px rgba(175, 182, 201, 0.2);",
        lg: "0 1rem 3rem rgba(0, 0, 0, 0.175)",
        "dark-md":
          "rgba(145, 158, 171, 0.3) 0px 0px 2px 0px, rgba(145, 158, 171, 0.02) 0px 12px 24px -4px",
        sm: "0 6px 24.2px -10px rgba(41, 52, 61, .22)",
        "btn-shadow": "box-shadow: rgba(0, 0, 0, .05) 0 9px 17.5px",
        tw: "rgba(175, 182, 201, 0.2) 0px 2px 4px -1px",
        // Sombra dorada para CTAs (reemplaza la azul anterior)
        btnshdw: "0 8px 24px rgba(212, 175, 55, .35)",
        elevation1: "0px 12px 30px -2px rgba(58,75,116,0.14);",
        elevation2: "0px 24px 24px -12px rgba(0,0,0,0.05);",
        elevation3: "0px 24px 24px -12px rgba(99,91,255,0.15);",
        elevation4: "0px 12px 12px -6px rgba(0,0,0,0.15);",
      },

      // Fondo tipo “carbon fiber / mesh” => className="bg-carbon"
      backgroundImage: {
        carbon:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,.06) 1px, transparent 0), radial-gradient(circle at 3px 3px, rgba(255,255,255,.04) 1px, transparent 0)",
      },

      borderRadius: {
        sm: "6px",
        md: "9px",
        lg: "24px",
        tw: "12px",
        bb: "20px",
      },
      container: {
        center: true,
        padding: "20px",
      },
      letterSpacing: {
        tightest: "-.075em",
        tighter: "-.05em",
        tight: "-.025em",
        normal: "0",
        wide: ".025em",
        wider: ".05em",
        widest: "1.5px",
      },
      gap: { "30": "30px" },
      padding: { "30": "30px" },
      margin: { "30": "30px" },
      fontSize: {
        "13": "13px",
        "15": "15px",
        "17": "17px",
        "22": "22px",
        "28": "28px",
        "34": "34px",
        "40": "40px",
        "44": "44px",
        "50": "50px",
        "56": "56px",
        "64": "64px",
      },
    },
  },
  plugins: [
    require("flowbite/plugin"),
  ],
};

export default config;
