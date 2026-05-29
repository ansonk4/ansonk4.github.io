import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#fbfaf7",
        wash: "#f3f1eb",
        muted: "#6b6862",
        bluewash: "#d7e8ef",
        greenwash: "#dcebd8",
        orangewash: "#f5d9ca"
      },
      fontFamily: {
        display: ["et-book", "Palatino", "Palatino Linotype", "Palatino LT STD", "Book Antiqua", "Georgia", "serif"],
        body: ["et-book", "Palatino", "Palatino Linotype", "Palatino LT STD", "Book Antiqua", "Georgia", "serif"],
        note: ["Comic Sans MS", "Bradley Hand", "cursive"]
      },
      boxShadow: {
        sketch: "0 1px 0 rgba(17, 17, 17, 0.22), 2px 3px 0 rgba(17, 17, 17, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
