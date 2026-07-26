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
        background: {
          DEFAULT: rgb("--background-rgb"),
          soft: "var(--background-soft)",
        },
        cream: {
          DEFAULT: "var(--cream)",
          light: "var(--cream-light)",
          dark: "var(--cream-dark)",
          white: "var(--cream-white)",
          soft: "var(--cream-soft)",
          deep: "var(--cream-deep)",
        },
        surface: {
          DEFAULT: rgb("--surface-rgb"),
          soft: rgb("--surface-soft-rgb"),
          warm: "var(--surface-warm)",
          hover: "var(--surface-hover)",
          peach: "var(--surface-peach)",
          yellow: "var(--surface-yellow)",
          coral: "var(--surface-coral)",
        },
        section: {
          DEFAULT: "var(--color-section)",
        },
        foreground: {
          DEFAULT: rgb("--text-primary-rgb"),
          secondary: rgb("--text-secondary-rgb"),
          muted: rgb("--text-muted-rgb"),
          inverse: "var(--text-inverse)",
        },
        primary: {
          DEFAULT: rgb("--primary-rgb"),
          hover: rgb("--primary-hover-rgb"),
          active: rgb("--primary-active-rgb"),
          pressed: rgb("--primary-pressed-rgb"),
          foreground: "#ffffff",
          soft: "var(--primary-soft)",
          subtle: "var(--primary-subtle)",
          light: "var(--primary-light)",
          dark: rgb("--primary-hover-rgb"),
        },
        orange: {
          DEFAULT: rgb("--orange-rgb"),
          soft: "var(--orange-soft)",
        },
        caramel: {
          DEFAULT: rgb("--caramel-rgb"),
          hover: rgb("--caramel-hover-rgb"),
          light: "var(--caramel-light)",
          soft: "var(--caramel-soft)",
          neutral: "var(--caramel-neutral)",
        },
        butter: {
          DEFAULT: rgb("--butter-rgb"),
          hover: "var(--butter-hover)",
          soft: "var(--butter-soft)",
        },
        peach: {
          DEFAULT: rgb("--peach-rgb"),
          hover: "var(--peach-hover)",
          soft: "var(--peach-soft)",
          light: "var(--peach-light)",
        },
        yellow: {
          DEFAULT: "var(--secondary-yellow)",
          soft: "var(--secondary-yellow-soft)",
          hover: "var(--secondary-yellow-hover)",
        },
        divider: {
          DEFAULT: rgb("--divider-rgb"),
        },
        danger: {
          DEFAULT: rgb("--danger-rgb"),
          soft: "var(--primary-soft)",
        },
        groupBuy: {
          DEFAULT: rgb("--group-buy-rgb"),
          hover: rgb("--group-buy-hover-rgb"),
          soft: "var(--group-buy-soft)",
          subtle: "var(--group-buy-subtle)",
          foreground: "#ffffff",
        },
        border: {
          DEFAULT: rgb("--border-rgb"),
          soft: rgb("--border-soft-rgb"),
          strong: rgb("--border-strong-rgb"),
        },
        price: {
          DEFAULT: rgb("--price-rgb"),
          soft: "var(--price-soft)",
        },
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
        disabled: {
          DEFAULT: rgb("--disabled-rgb"),
          soft: "var(--disabled-soft)",
        },

        card: {
          DEFAULT: "var(--card)",
          hover: "var(--card-hover)",
          foreground: rgb("--text-primary-rgb"),
        },
        brand: {
          primary: rgb("--primary-rgb"),
          secondary: rgb("--brand-secondary-rgb"),
          premium: rgb("--brand-premium-rgb"),
          peach: rgb("--peach-rgb"),
          cream: rgb("--cream-rgb"),
          caramel: rgb("--caramel-rgb"),
          yellow: "var(--secondary-yellow)",
          red: rgb("--primary-rgb"),
          orange: rgb("--orange-rgb"),
          mint: rgb("--success-rgb"),
          blue: rgb("--info-rgb"),
          ink: rgb("--text-primary-rgb"),
          muted: rgb("--text-secondary-rgb"),
          warm: rgb("--background-rgb"),
          blush: rgb("--surface-soft-rgb"),
          line: rgb("--border-rgb"),
          success: rgb("--success-rgb"),
          warning: rgb("--warning-rgb"),
          error: rgb("--danger-rgb"),
          primaryLight: "var(--primary-soft)",
          primaryDark: rgb("--primary-hover-rgb"),
          pink: rgb("--primary-rgb"),
          pinkLight: rgb("--surface-soft-rgb"),
        },
        premium: {
          DEFAULT: rgb("--brand-premium-rgb"),
          deep: "var(--brand-premium-deep)",
        },
        module: {
          materials: "var(--module-materials)",
          groupbuy: "var(--module-groupbuy)",
          recipe: "var(--module-recipe)",
          ai: "var(--module-ai)",
          video: "var(--module-video)",
          store: "var(--module-store)",
          course: "var(--module-course)",
          news: "var(--module-news)",
        },
        expiry: {
          ok: "var(--expiry-ok)",
          d30: "var(--expiry-30)",
          d14: "var(--expiry-14)",
          d7: "var(--expiry-7)",
          expired: "var(--expiry-expired)",
          done: "var(--expiry-done)",
        },
        ai: {
          DEFAULT: "var(--ai-primary)",
          bg: "var(--ai-bg)",
          cta: "var(--ai-cta)",
        },
        member: {
          standard: "var(--member-standard)",
          vip: "var(--member-vip)",
        },
        secondary: {
          DEFAULT: "var(--brand-secondary)",
          yellow: "var(--secondary-yellow)",
          peach: "var(--secondary-peach)",
          foreground: rgb("--text-primary-rgb"),
        },
        sale: rgb("--price-rgb"),
        promo: rgb("--group-buy-rgb"),
        coupon: rgb("--warning-rgb"),
        reward: rgb("--info-rgb"),
        fresh: rgb("--success-rgb"),
        frozen: rgb("--info-rgb"),
        mint: rgb("--success-rgb"),
        tag: {
          bg: "var(--tag-bg)",
          text: "var(--tag-text)",
          border: "var(--tag-border)",
        },
        countdown: rgb("--error-rgb"),
        nav: {
          active: rgb("--primary-rgb"),
          inactive: rgb("--nav-inactive-rgb"),
          icon: rgb("--header-icon-rgb"),
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
        chip: "var(--radius-chip)",
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
        hero: "var(--radius-hero)",
        sheet: "var(--radius-sheet)",
        sticker: "9999px",
        image: "var(--radius-image)",
      },
      maxWidth: {
        app: "var(--app-max-width)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
        floating: "var(--shadow-floating)",
        lift: "var(--shadow-lift)",
        brand: "var(--shadow-brand)",
        sticker: "var(--shadow-sticker)",
        header: "var(--shadow-header)",
        "brand-ring": "0 0 0 3px var(--ring-primary)",
        angel: "var(--shadow-brand)",
      },
      backgroundImage: {
        "brand-gradient": "var(--gradient-primary)",
        "promo-gradient": "var(--gradient-promo)",
        "mint-gradient": "var(--gradient-mint)",
        "hero-gradient": "var(--gradient-hero)",
        "ai-gradient": "var(--gradient-ai)",
        "store-gradient": "var(--gradient-store)",
        "member-gradient": "var(--gradient-member)",
        "vip-gradient": "var(--gradient-vip)",
        "skeleton-shimmer": "var(--gradient-skeleton)",
        "promo-strip":
          "linear-gradient(90deg, var(--surface-soft) 0%, var(--butter-soft) 100%)",
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
        sans: [
          "Noto Sans TC",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
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
