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
        card: "#FFF8F5",
        primary: {
          DEFAULT: "#C94C4C",
          foreground: "#FFFFFF",
          dark: "#B33E3E",
        },
        promo: "#D92D20",
        tag: {
          bg: "#F7DADA",
          text: "#9F2F2F",
        },
        countdown: "#9F2F2F",
        nav: {
          active: "#C94C4C",
          inactive: "#8A8A8A",
          icon: "#333333",
        },
        coffee: "#333333",
        border: "#E8E4DF",
        muted: "#F5F5F5",
        foreground: "#333333",
        "muted-foreground": "#8A8A8A",
        "card-foreground": "#333333",
      },
      boxShadow: {
        card: "0 2px 12px rgba(51, 51, 51, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
