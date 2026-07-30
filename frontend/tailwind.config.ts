import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        /* Severity semantic colors */
        "severity-critical": "var(--severity-critical)",
        "severity-critical-bg": "var(--severity-critical-bg)",
        "severity-high": "var(--severity-high)",
        "severity-high-bg": "var(--severity-high-bg)",
        "severity-medium": "var(--severity-medium)",
        "severity-medium-bg": "var(--severity-medium-bg)",
        "severity-low": "var(--severity-low)",
        "severity-low-bg": "var(--severity-low-bg)",

        /* Status semantic colors (resource availability) */
        "status-available": "var(--status-available)",
        "status-available-bg": "var(--status-available-bg)",
        "status-busy": "var(--status-busy)",
        "status-busy-bg": "var(--status-busy-bg)",
        "status-offline": "var(--status-offline)",
        "status-offline-bg": "var(--status-offline-bg)",

        /* Request status */
        "status-pending": "var(--status-pending)",
        "status-assigned": "var(--status-assigned)",
        "status-en-route": "var(--status-en-route)",
        "status-resolved": "var(--status-resolved)",

        /* Surface hierarchy */
        "surface-primary": "var(--surface-primary)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-elevated": "var(--surface-elevated)",

        /* Primary action */
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-muted": "var(--color-primary-muted)",

        /* Functional */
        success: "var(--color-success)",
        "success-bg": "var(--color-success-bg)",
        warning: "var(--color-warning)",
        "warning-bg": "var(--color-warning-bg)",
        error: "var(--color-error)",
        "error-bg": "var(--color-error-bg)",
        analytics: "var(--color-analytics)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jetbrains)",
          "JetBrains Mono",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        badge: "var(--radius-badge)",
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-in-top": "slide-in-top 200ms ease-out",
        "slide-in-bottom": "slide-in-bottom 200ms ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-top": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-bottom": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.3)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
