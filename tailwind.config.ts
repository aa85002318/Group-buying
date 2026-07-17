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
        background: "#F7F7F8",
        card: "#FFFFFF",
        brand: {
          red: "#F43F5E",
          orange: "#FF7A00",
          yellow: "#FFC83D",
          ink: "#222222",
          muted: "#737373",
          warm: "#FFFFFF",
          blush: "#FFF1F3",
          line: "#E5E5E5",
          success: "#35B77E",
          primary: "#F43F5E",
          primaryLight: "#FB7185",
          primaryDark: "#E92D2D",
          pink: "#F43F5E",
          pinkLight: "#FFF1F3",
        },
        primary: {
          DEFAULT: "#F43F5E",
          foreground: "#FFFFFF",
          light: "#FB7185",
          dark: "#E92D2D",
        },
        promo: "#E92D2D",
        tag: {
          bg: "#FFF1F3",
          text: "#E92D2D",
        },
        countdown: "#E92D2D",
        nav: {
          active: "#F43F5E",
          inactive: "#737373",
          icon: "#333333",
        },
        coffee: "#222222",
        border: "#E5E5E5",
        muted: "#FFF1F3",
        foreground: "#222222",
        "muted-foreground": "#737373",
        "card-foreground": "#222222",
      },
      borderRadius: {
        card: "1.25rem",
        button: "0.875rem",
        input: "0.875rem",
      },
      maxWidth: {
        app: "80rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(34, 34, 34, 0.08)",
        brand: "0 10px 24px rgba(244, 63, 94, 0.26)",
        "brand-ring": "0 0 0 4px rgba(244, 63, 94, 0.14)",
        angel: "0 12px 28px rgba(244, 63, 94, 0.34)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #F43F5E 0%, #FF7A00 100%)",
        "promo-gradient": "linear-gradient(135deg, #FFC83D 0%, #FF7A00 100%)",
        "promo-strip": "linear-gradient(90deg, #FFF1F3 0%, #FFF8E8 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
