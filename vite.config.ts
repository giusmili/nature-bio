import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '')
    // console.log("Loaded ENV: ", env);

    const claudeKey = env.VITE_API_KEY_CLAUDE
    console.log('claude key: ', claudeKey)

    // const geminiKey = env.VITE_API_KEY_GEMINI;

    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
            proxy: {
                '/api/claude': {
                    target: 'https://api.anthropic.com',
                    changeOrigin: true,
                    secure: true,
                    // /api/claude -> /v1/messages
                    rewrite: (path) => path.replace(/^\/api\/claude/, '/v1/messages'),
                    headers: {
                        ...(claudeKey ? { 'x-api-key': claudeKey } : {}),
                        'anthropic-version': '2023-06-01',
                        // 👇 Anthropic doesnt like direct call from localhost..
                        'anthropic-dangerous-direct-browser-access': 'true',
                    },
                },
            },
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            },
        },
    }
})
