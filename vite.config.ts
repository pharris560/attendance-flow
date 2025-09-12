import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  envPrefix: 'VITE_', // explicit
  define: {
    __BUILD_COMMIT__: JSON.stringify(
      process.env.COMMIT_REF ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      ''
    ),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // optional, handy for debugging
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
