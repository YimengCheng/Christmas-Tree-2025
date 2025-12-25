
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  root: './',
  build: {
    // 关键修改：去掉 ../ 
    // 这样打包后的文件夹会生成在 🎄-global-christmas-tree/dist
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000
  }
});
