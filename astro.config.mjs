// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://buscamostutrastero.com',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), sitemap({
    filter: (page) => !['/aviso-legal/', '/politica-privacidad/'].includes(new URL(page).pathname)
      && !new URL(page).pathname.startsWith('/api/')
      && !/\.(?:txt|md)$/.test(new URL(page).pathname),
  })]
});
