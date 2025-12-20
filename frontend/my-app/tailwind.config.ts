import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tech-inspired color palette
        cyber: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        electric: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        neon: {
          pink: '#ff006e',
          purple: '#8338ec',
          blue: '#3a86ff',
          cyan: '#00f5ff',
          green: '#06ffa5',
          yellow: '#ffbe0b',
        },
        dark: {
          50: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
          300: '#52525b',
          400: '#71717a',
          500: '#a1a1aa',
          600: '#d4d4d8',
          700: '#e4e4e7',
          800: '#f4f4f5',
          900: '#fafafa',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-tech': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
        'gradient-electric': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        'gradient-neon': 'linear-gradient(135deg, #3a86ff 0%, #ff006e 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(14, 165, 233, 0.3)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.4)',
        'glow-lg': '0 0 30px rgba(14, 165, 233, 0.5)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
        'neon-blue': '0 0 5px #3a86ff, 0 0 10px #3a86ff, 0 0 15px #3a86ff',
        'neon-purple': '0 0 5px #8338ec, 0 0 10px #8338ec, 0 0 15px #8338ec',
        'neon-pink': '0 0 5px #ff006e, 0 0 10px #ff006e, 0 0 15px #ff006e',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.2), 0 0 10px rgba(14, 165, 233, 0.2)' },
          '100%': { boxShadow: '0 0 10px rgba(14, 165, 233, 0.4), 0 0 20px rgba(14, 165, 233, 0.4), 0 0 30px rgba(14, 165, 233, 0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      borderRadius: {
        'tech': '0.75rem',
        'tech-lg': '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
