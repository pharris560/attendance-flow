import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',                // explicit root deploy
  plugins: [react()],
  envPrefix: 'VITE_',       // default, but explicit
  define: {
    __BUILD_COMMIT__: JSON.stringify(process.env.COMMIT_REF || ''),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    sourcemap: true,        // optional: easier prod debugging
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
