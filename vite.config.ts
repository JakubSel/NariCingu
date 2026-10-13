import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relatívna base cesta => funguje na GitHub Pages v ľubovoľnom podadresári.
export default defineConfig({
  base: './',
  plugins: [react()],
});
