import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Essential for GitHub Pages relative path resolution
  server: {
    port: 5173
  }
});
