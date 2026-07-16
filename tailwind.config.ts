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
        background: "#FFFDFC",
        card: "#FFFFFF",
        brand: {
          red: "#D92D2D",
          orange: "#FF8F9C",
          yellow: "#FFC83D",
          ink: "#292525",
          muted: "#777070",
          warm: "#FFFDFC",
          blush: "#FFF0F1",
          line: "#F0DDDD",
          success: "#35B77E",
          primary: "#D92D2D",
          primaryLight: "#F04444",
          primaryDark: "#A61F2B",
          pink: "#FF8F9C",
          pinkLight: "#FFF0F1",
        },
        primary: {
          DEFAULT: "#D92D2D",
          foreground: "#FFFFFF",
          light: "#F04444",
          dark: "#A61F2B",
        },
        promo: "#FFC83D",
        tag: {
          bg: "#FFF0F1",
          text: "#D92D2D",
        },
        countdown: "#A61F2B",
        nav: {
          active: "#D92D2D",
          inactive: "#777070",
          icon: "#292525",
        },
        coffee: "#292525",
        border: "#F0DDDD",
        muted: "#FFF0F1",
        foreground: "#292525",
        "muted-foreground": "#777070",
        "card-foreground": "#292525",
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
        card: "0 4px 20px rgba(41, 37, 37, 0.06)",
        brand: "0 8px 20px rgba(217, 45, 45, 0.22)",
        "brand-ring": "0 0 0 4px rgba(240, 68, 68, 0.12)",
        angel: "0 10px 24px rgba(240, 68, 68, 0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #F04444 0%, #FF7C88 100%)",
        "promo-gradient": "linear-gradient(135deg, #FFC83D 0%, #FF8A3D 100%)",
        "promo-strip": "linear-gradient(90deg, #FFF0F1 0%, #FFF8E8 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
