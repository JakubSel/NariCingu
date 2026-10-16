/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'sans-serif'],
        ko: ['Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Noto Sans CJK KR', 'Nanum Gothic', 'sans-serif'],
      },
      // Celadon farby čítačky príbehov – premenné sú definované len pod .ilgi-reader (src/features/stories/stories.css).
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        celadon: {
          DEFAULT: 'rgb(var(--celadon) / <alpha-value>)',
          ink: 'rgb(var(--celadon-ink) / <alpha-value>)',
          soft: 'rgb(var(--celadon-soft) / <alpha-value>)',
        },
        plum: 'rgb(var(--plum) / <alpha-value>)',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.96)' }, '60%': { transform: 'scale(1.03)' }, '100%': { transform: 'scale(1)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
        fadein: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        pop: 'pop .25s ease-out',
        shake: 'shake .3s ease-in-out',
        fadein: 'fadein .2s ease-out',
      },
    },
  },
  plugins: [],
};
