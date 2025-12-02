import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const claudeKey =
      env.VITE_API_KEY_CLAUDE ||
      env.VITE_CLAUDE_API_KEY ||
      process.env.API_KEY_CLAUDE ||
      process.env.CLAUDE_API_KEY ||
      process.env.VITE_API_KEY_CLAUDE ||
      process.env.VITE_CLAUDE_API_KEY;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/claude': {
            target: 'https://api.anthropic.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/claude/, '/v1/messages'),
            headers: {
              ...(claudeKey ? { 'x-api-key': claudeKey } : {}),
              'anthropic-version': '2023-06-01',
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
