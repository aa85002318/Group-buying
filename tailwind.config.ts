import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        card: "#FFF9F5",
        brand: {
          red: "#E53935",
          orange: "#FF6B00",
          yellow: "#FFC928",
          ink: "#252525",
          muted: "#737373",
          warm: "#FFF9F5",
          blush: "#FFF0EB",
          line: "#F2DEDC",
          success: "#20A464",
        },
        primary: {
          DEFAULT: "#E53935",
          foreground: "#FFFFFF",
          dark: "#C62828",
        },
        promo: "#FF6B00",
        tag: {
          bg: "#FFF0EB",
          text: "#E53935",
        },
        countdown: "#E53935",
        nav: {
          active: "#E53935",
          inactive: "#737373",
          icon: "#252525",
        },
        coffee: "#252525",
        border: "#F2DEDC",
        muted: "#FFF9F5",
        foreground: "#252525",
        "muted-foreground": "#737373",
        "card-foreground": "#252525",
      },
      boxShadow: {
        card: "0 2px 12px rgba(37, 37, 37, 0.08)",
        brand: "0 6px 16px rgba(229, 57, 53, 0.22)",
        "brand-ring": "0 0 0 4px rgba(229, 57, 53, 0.10)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #E53935 0%, #FF6B00 100%)",
        "promo-strip": "linear-gradient(90deg, #FFF1E8 0%, #FFF8DC 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
