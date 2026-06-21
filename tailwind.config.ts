import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand: dark navy (from prototype, not the red)
        navy: {
          50: "#F2F4FA",
          100: "#E5E9F4",
          200: "#C2CAE3",
          300: "#9AA6CC",
          400: "#5B6CA5",
          500: "#2D3F7E",
          600: "#1F2E66",
          700: "#1A2657", // ★ MAIN — del prototipo
          800: "#141D44",
          900: "#0D1530",
        },
        // Accent red (from the logo, used only for brand/danger)
        brand: {
          50: "#FFF0F0",
          100: "#FED4D4",
          200: "#FDA8A8",
          500: "#D42B2B", // ★ MAIN — del logo
          700: "#8C1B1B",
          900: "#3D0D0D",
        },
        // Semáforo (used in URL analyzer)
        safe: {
          50: "#F0FDF4",
          200: "#86EFAC",
          500: "#16A34A",
          900: "#14532D",
        },
        warn: {
          50: "#FFFBEB",
          200: "#FDE68A",
          500: "#D97706",
          900: "#78350F",
        },
        // Background neutrals
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F5F7", // app background
          subtle: "#FAFAFC",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        nav: "0 -1px 3px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
