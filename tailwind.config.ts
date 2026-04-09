import type { Config } from "tailwindcss";

/**
 * Tailwind v4 uses `app/globals.css` `@theme` for most tokens.
 * This file documents the Masters palette and keeps content paths explicit.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        masters: {
          green: "#0b553d",
          "green-dark": "#063728",
          ink: "#0f291e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
