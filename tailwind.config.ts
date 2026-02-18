import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Outfit", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        phantom: {
          bg: "var(--phantom-bg)",
          bgSecondary: "var(--phantom-bg-secondary)",
          bgTertiary: "var(--phantom-bg-tertiary)",
          bgCard: "var(--phantom-bg-card)",
          bgCardHover: "var(--phantom-bg-card-hover)",
          bgInput: "var(--phantom-bg-input)",
          border: "var(--phantom-border)",
          borderHover: "var(--phantom-border-hover)",
          text: "var(--phantom-text)",
          textSecondary: "var(--phantom-text-secondary)",
          textTertiary: "var(--phantom-text-tertiary)",
          textMuted: "var(--phantom-text-muted)",
          success: "var(--phantom-success)",
          warning: "var(--phantom-warning)",
          danger: "var(--phantom-danger)",
          accentBg: "var(--phantom-accent-bg)",
        },
        border: "var(--phantom-border)",
        input: "var(--phantom-bg-input)",
        background: "var(--phantom-bg)",
        foreground: "var(--phantom-text)",
        card: {
          DEFAULT: "var(--phantom-bg-card)",
          foreground: "var(--phantom-text)",
        },
        muted: {
          DEFAULT: "var(--phantom-bg-tertiary)",
          foreground: "var(--phantom-text-tertiary)",
        },
        destructive: {
          DEFAULT: "var(--phantom-danger)",
          foreground: "#FAFAFA",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
        xs: "6px",
      },
      fontSize: {
        "page-title": ["26px", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.03em" }],
        "section-heading": ["22px", { lineHeight: "1.3", fontWeight: "700", letterSpacing: "-0.03em" }],
        "card-title": ["15px", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["13px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-mono": ["11px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.05em" }],
        "caption": ["11px", { lineHeight: "1.4", fontWeight: "400" }],
        "micro": ["10px", { lineHeight: "1.4", fontWeight: "400" }],
        "large-metric": ["28px", { lineHeight: "1", fontWeight: "700", letterSpacing: "-0.03em" }],
        "xl-metric": ["48px", { lineHeight: "1", fontWeight: "800", letterSpacing: "-0.03em" }],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "breathing": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "spring-in": {
          "0%": { transform: "scale(0)" },
          "70%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "typing-dot": {
          "0%, 100%": { transform: "scale(0)" },
          "50%": { transform: "scale(1)" },
        },
        "count-up": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.2s ease-out",
        "slide-out-right": "slide-out-right 0.2s ease-out",
        "breathing": "breathing 3s ease-in-out infinite",
        "shimmer": "shimmer 1.5s linear infinite",
        "shake": "shake 0.3s ease-in-out",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "spring-in": "spring-in 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
        "typing-dot-1": "typing-dot 1.4s infinite 0s",
        "typing-dot-2": "typing-dot 1.4s infinite 0.2s",
        "typing-dot-3": "typing-dot 1.4s infinite 0.4s",
      },
      boxShadow: {
        "phantom-sm": "0 1px 2px rgba(0,0,0,0.3)",
        "phantom-md": "0 4px 12px rgba(0,0,0,0.3)",
        "phantom-lg": "0 8px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
