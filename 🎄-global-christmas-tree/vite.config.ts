
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  root: './',
  build: {
    // 关键修复：去掉 ../ 确保生成在子目录内
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000
  }
});
