
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-importmap',
      transformIndexHtml(html) {
        // 在打包時自動移除 importmap，避免與 Vercel 的依賴衝突 (解決 Error #525)
        return html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
      }
    }
  ],
});