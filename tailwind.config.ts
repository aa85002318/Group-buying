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
        background: "#F7F7F9",
        card: "#FFFFFF",
        brand: {
          red: "#E9285C",
          orange: "#FF8300",
          yellow: "#FFC400",
          ink: "#202124",
          muted: "#6B7280",
          warm: "#FFFFFF",
          blush: "#FFF0F4",
          line: "#E5E7EB",
          success: "#23B26D",
          primary: "#E9285C",
          primaryLight: "#F94C77",
          primaryDark: "#B81648",
          pink: "#E9285C",
          pinkLight: "#FFF0F4",
        },
        primary: {
          DEFAULT: "#E9285C",
          foreground: "#FFFFFF",
          light: "#F94C77",
          dark: "#B81648",
        },
        sale: "#FF4D36",
        promo: "#FF4D36",
        coupon: "#FFC400",
        reward: "#A93DDB",
        fresh: "#23B26D",
        frozen: "#268CFF",
        tag: {
          bg: "#FFF0F4",
          text: "#E9285C",
        },
        countdown: "#FF4D36",
        nav: {
          active: "#E9285C",
          inactive: "#6B7280",
          icon: "#6B7280",
        },
        coffee: "#202124",
        border: "#E5E7EB",
        muted: "#F3F4F6",
        foreground: "#202124",
        "muted-foreground": "#6B7280",
        "card-foreground": "#202124",
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
        brand: "0 10px 24px rgba(233, 40, 92, 0.28)",
        "brand-ring": "0 0 0 4px rgba(233, 40, 92, 0.15)",
        angel: "0 12px 28px rgba(233, 40, 92, 0.38)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #E9285C 0%, #FF4D36 52%, #FF8300 100%)",
        "promo-gradient": "linear-gradient(135deg, #FFC400 0%, #FF8300 100%)",
        "promo-strip": "linear-gradient(90deg, #FFF0F4 0%, #FFF8E0 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
