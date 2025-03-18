import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        noto: ["Noto Kufi Arabic", "sans-serif"],
        cairo: ["Cairo", "sans-serif"],
        amiri: ["Amiri", "serif"],
        tajawal: ["Tajawal", "sans-serif"],
        dubai: ["Dubai", "sans-serif"],
        'ibm-plex': ["IBM Plex Sans Arabic", "sans-serif"],
        'aref-ruqaa': ["Aref Ruqaa", "serif"],
        lateef: ["Lateef", "serif"],
        'reem-kufi': ["Reem Kufi", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "var(--primary-color)",
          light: "color-mix(in srgb, var(--primary-color) 80%, white)",
          dark: "color-mix(in srgb, var(--primary-color) 80%, black)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "var(--secondary-color)",
          light: "color-mix(in srgb, var(--secondary-color) 80%, white)",
          dark: "color-mix(in srgb, var(--secondary-color) 80%, black)",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "var(--accent-color)",
          light: "color-mix(in srgb, var(--accent-color) 80%, white)",
          dark: "color-mix(in srgb, var(--accent-color) 80%, black)",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "theme-switch": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "theme-switch": "theme-switch 0.3s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;