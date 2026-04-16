import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        /* CRM Desktop — Inter as primary */
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "Helvetica", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        neutral: {
          DEFAULT: "hsl(var(--neutral))",
          foreground: "hsl(var(--neutral-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          muted: "hsl(var(--sidebar-muted))",
        },
        gov: {
          header: "hsl(var(--gov-header))",
          "header-foreground": "hsl(var(--gov-header-foreground))",
        },
        /* SAP Fiori Accent Colors */
        fiori: {
          "accent-1": "hsl(var(--fiori-accent-1))",
          "accent-2": "hsl(var(--fiori-accent-2))",
          "accent-3": "hsl(var(--fiori-accent-3))",
          "accent-4": "hsl(var(--fiori-accent-4))",
          "accent-5": "hsl(var(--fiori-accent-5))",
          "accent-6": "hsl(var(--fiori-accent-6))",
          "accent-7": "hsl(var(--fiori-accent-7))",
          "accent-8": "hsl(var(--fiori-accent-8))",
          "accent-9": "hsl(var(--fiori-accent-9))",
          "accent-10": "hsl(var(--fiori-accent-10))",
        },
        /* SAP Fiori Semantic Background Colors */
        "semantic-bg": {
          negative: "hsl(var(--negative-bg))",
          critical: "hsl(var(--critical-bg))",
          positive: "hsl(var(--positive-bg))",
          neutral: "hsl(var(--neutral-bg))",
          information: "hsl(var(--information-bg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius-sm, calc(var(--radius) - 2px))",
        sm: "calc(var(--radius-sm, var(--radius)) - 2px)",
      },
      boxShadow: {
        /* SAP Fiori Shadow Levels */
        "fiori-0": "none",
        "fiori-1": "0 1px 4px 0 rgba(19,30,41,0.08), 0 1px 2px 0 rgba(19,30,41,0.04)",
        "fiori-2": "0 4px 16px 0 rgba(19,30,41,0.12), 0 2px 4px 0 rgba(19,30,41,0.06)",
        "fiori-3": "0 8px 32px 0 rgba(19,30,41,0.16), 0 4px 8px 0 rgba(19,30,41,0.08)",
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
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "counter": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "counter": "counter 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
