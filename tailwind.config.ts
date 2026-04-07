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
        bg: "#f8f3ea",
        card: "#fffdf8",
        ink: "#181511",
        muted: "#70655a",
        line: "#dfd5c8",
        accent: "#e1662a",
        glow: "#bf4a13"
      },
      boxShadow: {
        card: "0 10px 30px rgba(24, 21, 17, 0.08)"
      },
      fontFamily: {
        sans: [
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "\"IBM Plex Mono\"",
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

