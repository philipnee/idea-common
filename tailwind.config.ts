import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f4eee4",
        card: "#e9dfcf",
        ink: "#40352e",
        muted: "#8b7a6d",
        line: "#dfd2c1",
        accent: "#c47838",
        glow: "#9a4c1b"
      },
      boxShadow: {
        card: "0 1px 0 rgba(64, 53, 46, 0.06)"
      },
      fontFamily: {
        sans: [
          "\"Iowan Old Style\"",
          "\"Palatino Linotype\"",
          "\"Book Antiqua\"",
          "Georgia",
          "sans-serif"
        ],
        display: [
          "\"Iowan Old Style\"",
          "\"Palatino Linotype\"",
          "\"Book Antiqua\"",
          "Georgia",
          "serif"
        ],
        mono: [
          "\"SFMono-Regular\"",
          "ui-monospace",
          "monospace"
        ]
      }
    }
  },
  plugins: []
};

export default config;
