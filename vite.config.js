import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        define: {
            'process.env.AI_KEY': JSON.stringify(env.AI_KEY),
            'process.env.AI_URL': JSON.stringify(env.AI_URL),
            'process.env.AI_MODEL': JSON.stringify(env.AI_MODEL),
        }
    };
});
