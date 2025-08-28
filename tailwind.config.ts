import type { Config } from "tailwindcss";
const { nextui } = require("@nextui-org/react");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        yellow: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        green: {
          500: '#22c55e',
          600: '#16a34a',
        },
        red: {
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      animation: {
        // Bounces 5 times 1s equals 5 seconds
        "ping-short": "ping 1s ease-in-out 5",
        "ping-infinite": "ping 1s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      screens: {
        betterhover: { raw: "(hover: hover)" },
      },
      transitionProperty: {
        height: "height",
        width: "width",
      },
      dropShadow: {
        glowYellow: [
          "0px 0px 8px rgba(234, 179, 8, 0.4)",
          "0px 0px 24px rgba(234, 179, 8, 0.2)",
        ],
        glowGreen: [
          "0px 0px 8px rgba(34, 197, 94, 0.4)",
          "0px 0px 24px rgba(34, 197, 94, 0.2)",
        ],
        glowRed: [
          "0px 0px 8px rgba(239, 68, 68, 0.4)",
          "0px 0px 24px rgba(239, 68, 68, 0.2)",
        ],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-stone": "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
      },
      fontFamily: {
        favorit: ["var(--font-favorit)"],
        inter: ["Inter", "Arial", "sans serif"],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [nextui()],
};
export default config;
