// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
    site: 'https://notionglaze.cc',
    output: 'server',
    adapter: cloudflare({
        imageService: 'compile'
    }),
    integrations: [tailwind(), react(), auth({ configFile: '../../auth.config.ts' })],
    security: {
        checkOrigin: false
    },
    server: {
        host: true
    }
});
