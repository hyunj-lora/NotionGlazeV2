// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://notionglaze.cc',
    output: 'server',
    adapter: cloudflare({
        imageService: 'compile'
    }),
    integrations: [tailwind(), react()],
    security: {
        checkOrigin: false
    },
    server: {
        host: true
    }
});
