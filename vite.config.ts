import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR can be disabled in constrained editor/runtime environments.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when HMR is off to reduce CPU usage.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
