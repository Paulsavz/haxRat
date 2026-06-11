import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind preset for the retail platform design system.
 *
 * Any app can adopt the full token set + animations by adding this preset:
 *
 *   import retailPreset from '@retail/ui/tailwind-preset';
 *
 *   export default {
 *     presets: [retailPreset],
 *     content: [
 *       './src/**\/*.{ts,tsx}',
 *       // ensure the design-system classes get scanned:
 *       '../../packages/ui/src/**\/*.{ts,tsx}',
 *     ],
 *   } satisfies Config;
 *
 * Colors are driven by CSS variables (see styles.css) so a single class set
 * works in both light and dark mode and can be re-themed per brand.
 */
const preset: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--ui-border) / <alpha-value>)',
        input: 'hsl(var(--ui-input) / <alpha-value>)',
        ring: 'hsl(var(--ui-ring) / <alpha-value>)',
        background: 'hsl(var(--ui-background) / <alpha-value>)',
        foreground: 'hsl(var(--ui-foreground) / <alpha-value>)',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: 'hsl(var(--ui-brand) / <alpha-value>)',
          foreground: 'hsl(var(--ui-brand-foreground) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'hsl(var(--ui-surface) / <alpha-value>)',
          subtle: 'hsl(var(--ui-surface-subtle) / <alpha-value>)',
          muted: 'hsl(var(--ui-surface-muted) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--ui-muted) / <alpha-value>)',
          foreground: 'hsl(var(--ui-muted-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--ui-success) / <alpha-value>)',
          foreground: 'hsl(var(--ui-success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--ui-warning) / <alpha-value>)',
          foreground: 'hsl(var(--ui-warning-foreground) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--ui-danger) / <alpha-value>)',
          foreground: 'hsl(var(--ui-danger-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '2xl': '1rem',
        xl: '0.875rem',
        lg: 'var(--ui-radius)',
        md: 'calc(var(--ui-radius) - 2px)',
        sm: 'calc(var(--ui-radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgba(15,23,42,0.06)',
        card: '0 4px 16px 0 rgba(15,23,42,0.08)',
        lifted: '0 8px 32px 0 rgba(15,23,42,0.12)',
        float: '0 16px 48px 0 rgba(15,23,42,0.18)',
        glow: '0 0 0 1px rgba(99,102,241,0.2), 0 8px 24px -4px rgba(99,102,241,0.35)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(1.7)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.32,0.72,0,1)',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.32,0.72,0,1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.32,0.72,0,1)',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      backgroundImage: {
        'shimmer-gradient':
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
      },
    },
  },
};

export default preset;
