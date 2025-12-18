import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/tal-api': {
            target: 'http://ai-service.tal.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/tal-api/, '')
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.TAL_APP_ID': JSON.stringify(env.TAL_APP_ID),
        'process.env.TAL_APP_KEY': JSON.stringify(env.TAL_APP_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
