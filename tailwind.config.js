/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'border-wood-50', 'border-wood-100', 'border-wood-200', 'border-wood-300', 'border-wood-400',
    'border-wood-500', 'border-wood-600', 'border-wood-700', 'border-wood-800', 'border-wood-900',
    'bg-wood-50', 'bg-wood-100', 'bg-wood-200', 'bg-wood-300', 'bg-wood-400',
    'bg-wood-500', 'bg-wood-600', 'bg-wood-700', 'bg-wood-800', 'bg-wood-900',
    'text-wood-50', 'text-wood-100', 'text-wood-200', 'text-wood-300', 'text-wood-400',
    'text-wood-500', 'text-wood-600', 'text-wood-700', 'text-wood-800', 'text-wood-900',
    'shadow-wood', 'shadow-wood-lg',
    'from-wood-50', 'from-wood-100', 'from-wood-200', 'from-wood-300', 'from-wood-400',
    'from-wood-500', 'from-wood-600', 'from-wood-700', 'from-wood-800', 'from-wood-900',
    'to-wood-50', 'to-wood-100', 'to-wood-200', 'to-wood-300', 'to-wood-400',
    'to-wood-500', 'to-wood-600', 'to-wood-700', 'to-wood-800', 'to-wood-900',
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: "#faf6f3",
          100: "#f5efe7",
          200: "#ecdcc6",
          300: "#d9bc8c", // light wood
          400: "#c5a76b",
          500: "#b08655", // classic wood
          600: "#96683a", // deep wood
          700: "#7d4b24",
          800: "#623618",
          900: "#42240f"
        },
        beige: "#f7f2e4",
        cream: "#fbf8f1",
        linen: "#faf0e6",
        brown: "#8b5c2a",
        darkwood: "#5c3310",
        accent: {
          emerald: "#2d9d78",
          emeraldLight: "#a7e3d4",
          gold: "#d4af37",
          goldLight: "#f8e9b0",
          terracotta: "#e07a5f",
          terracottaLight: "#f5c4b8"
        }
      },
      fontFamily: {
        display: ["Merriweather", "serif"],
        body: ["Inter", "sans-serif"]
      },
      boxShadow: {
        wood: "0 4px 12px -2px rgba(139, 92, 42, 0.12)",
        "wood-lg": "0 8px 24px -4px rgba(139, 92, 42, 0.15)",
        amber: "0 4px 12px -2px rgba(217, 119, 6, 0.12)",
        "amber-lg": "0 8px 24px -4px rgba(217, 119, 6, 0.15)",
        inner: "inset 0 2px 4px 0 rgba(139, 92, 42, 0.06)"
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem"
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 3s infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "slide-in-right": "slideInRight 0.5s ease-out",
        "scale": "scale 0.3s ease-out"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        slideInRight: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        scale: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      },
      backgroundImage: {
        "wood-pattern": "url('/images/wood-pattern.svg')",
        "grain-texture": "url('/images/grain-texture.svg')"
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
}
