import type { Config } from "tailwindcss";

/** RGB channel color with Tailwind opacity support */
const rgb = (channel: string) => `rgb(var(${channel}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: rgb("--background-rgb"),
        surface: {
          DEFAULT: rgb("--surface-rgb"),
          soft: rgb("--surface-soft-rgb"),
        },
        foreground: {
          DEFAULT: rgb("--text-primary-rgb"),
          secondary: rgb("--text-secondary-rgb"),
        },
        primary: {
          DEFAULT: rgb("--primary-rgb"),
          hover: rgb("--primary-hover-rgb"),
          foreground: "#ffffff",
          soft: "var(--primary-soft)",
          light: "var(--primary-soft)",
          dark: rgb("--primary-hover-rgb"),
        },
        groupBuy: {
          DEFAULT: rgb("--group-buy-rgb"),
          hover: rgb("--group-buy-hover-rgb"),
          soft: "var(--group-buy-soft)",
          foreground: "#ffffff",
        },
        border: rgb("--border-rgb"),
        price: rgb("--price-rgb"),
        success: {
          DEFAULT: rgb("--success-rgb"),
          soft: "var(--success-soft)",
        },
        warning: {
          DEFAULT: rgb("--warning-rgb"),
          soft: "var(--warning-soft)",
        },
        error: {
          DEFAULT: rgb("--error-rgb"),
          soft: "var(--error-soft)",
        },
        info: {
          DEFAULT: rgb("--info-rgb"),
          soft: "var(--info-soft)",
        },
        disabled: rgb("--disabled-rgb"),

        card: {
          DEFAULT: rgb("--surface-rgb"),
          foreground: rgb("--text-primary-rgb"),
        },
        brand: {
          red: rgb("--primary-rgb"),
          orange: rgb("--group-buy-rgb"),
          yellow: rgb("--warning-rgb"),
          mint: rgb("--success-rgb"),
          blue: rgb("--info-rgb"),
          ink: rgb("--text-primary-rgb"),
          muted: rgb("--text-secondary-rgb"),
          warm: rgb("--background-rgb"),
          blush: rgb("--surface-soft-rgb"),
          line: rgb("--border-rgb"),
          success: rgb("--success-rgb"),
          warning: rgb("--warning-rgb"),
          error: rgb("--error-rgb"),
          primary: rgb("--primary-rgb"),
          primaryLight: "var(--primary-soft)",
          primaryDark: rgb("--primary-hover-rgb"),
          pink: rgb("--primary-rgb"),
          pinkLight: rgb("--surface-soft-rgb"),
        },
        secondary: {
          DEFAULT: rgb("--group-buy-rgb"),
          foreground: "#ffffff",
        },
        sale: rgb("--price-rgb"),
        promo: rgb("--group-buy-rgb"),
        coupon: rgb("--warning-rgb"),
        reward: rgb("--info-rgb"),
        fresh: rgb("--success-rgb"),
        frozen: rgb("--info-rgb"),
        mint: rgb("--success-rgb"),
        tag: {
          bg: rgb("--surface-soft-rgb"),
          text: rgb("--primary-rgb"),
        },
        countdown: rgb("--error-rgb"),
        nav: {
          active: rgb("--primary-rgb"),
          inactive: rgb("--text-secondary-rgb"),
          icon: rgb("--text-secondary-rgb"),
        },
        coffee: rgb("--text-primary-rgb"),
        muted: {
          DEFAULT: rgb("--surface-soft-rgb"),
          foreground: rgb("--text-secondary-rgb"),
        },
        "muted-foreground": rgb("--text-secondary-rgb"),
        "card-foreground": rgb("--text-primary-rgb"),
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
        sticker: "9999px",
        image: "var(--radius-image)",
      },
      maxWidth: {
        app: "80rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        brand: "var(--shadow-brand)",
        sticker: "var(--shadow-sticker)",
        header: "var(--shadow-header)",
        "brand-ring": "0 0 0 4px var(--ring-primary)",
        angel: "var(--shadow-brand)",
      },
      backgroundImage: {
        "brand-gradient": "var(--gradient-primary)",
        "promo-gradient": "var(--gradient-promo)",
        "mint-gradient": "var(--gradient-mint)",
        "hero-gradient": "var(--gradient-hero)",
        "promo-strip":
          "linear-gradient(90deg, var(--surface-soft) 0%, var(--warning-soft) 100%)",
      },
      transitionTimingFunction: {
        brand: "var(--ease-out)",
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
      minHeight: {
        touch: "var(--touch-min)",
      },
      minWidth: {
        touch: "var(--touch-min)",
      },
    },
  },
  plugins: [],
};
export default config;
