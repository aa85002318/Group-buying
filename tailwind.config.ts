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
        background: "#FFF8F6",
        card: "#FFFFFF",
        brand: {
          red: "#E9285C",
          orange: "#FF7A45",
          yellow: "#FFC83D",
          mint: "#4CC9A6",
          blue: "#3A86FF",
          ink: "#222222",
          muted: "#757575",
          warm: "#FFF8F6",
          blush: "#FFF0F4",
          line: "#F0E4E0",
          success: "#31B057",
          warning: "#FF9F1C",
          error: "#E53935",
          primary: "#E9285C",
          primaryLight: "#F94C77",
          primaryDark: "#C41F4D",
          pink: "#E9285C",
          pinkLight: "#FFF0F4",
        },
        primary: {
          DEFAULT: "#E9285C",
          foreground: "#FFFFFF",
          light: "#F94C77",
          dark: "#C41F4D",
        },
        secondary: {
          DEFAULT: "#FF7A45",
          foreground: "#FFFFFF",
        },
        sale: "#E9285C",
        promo: "#FF7A45",
        coupon: "#FFC83D",
        reward: "#C45CDB",
        fresh: "#31B057",
        frozen: "#3A86FF",
        mint: "#4CC9A6",
        tag: {
          bg: "#FFF0F4",
          text: "#E9285C",
        },
        countdown: "#E53935",
        nav: {
          active: "#E9285C",
          inactive: "#757575",
          icon: "#757575",
        },
        coffee: "#222222",
        border: "#F0E4E0",
        muted: "#FFF1EC",
        foreground: "#222222",
        "muted-foreground": "#757575",
        "card-foreground": "#222222",
      },
      borderRadius: {
        card: "1.25rem",
        button: "0.875rem",
        input: "0.875rem",
        sticker: "9999px",
      },
      maxWidth: {
        app: "80rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(34, 34, 34, 0.06)",
        lift: "0 14px 32px rgba(233, 40, 92, 0.14)",
        brand: "0 10px 24px rgba(233, 40, 92, 0.28)",
        sticker: "0 4px 12px rgba(34, 34, 34, 0.12)",
        "brand-ring": "0 0 0 4px rgba(233, 40, 92, 0.15)",
        angel: "0 12px 28px rgba(233, 40, 92, 0.38)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #E9285C 0%, #FF7A45 100%)",
        "promo-gradient": "linear-gradient(135deg, #FFC83D 0%, #FF7A45 100%)",
        "mint-gradient": "linear-gradient(135deg, #4CC9A6 0%, #3A86FF 100%)",
        "hero-gradient": "linear-gradient(135deg, #E9285C 0%, #FF7A45 55%, #FFC83D 100%)",
        "promo-strip": "linear-gradient(90deg, #FFF0F4 0%, #FFF8E0 100%)",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        250: "250ms",
        400: "400ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      },
      fontFamily: {
        sans: ["PingFang TC", "Noto Sans TC", "Helvetica Neue", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
