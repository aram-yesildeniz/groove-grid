import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// The one place the deploy base path is set (AD-12). Manifest scope/start_url derive from it.
const BASE = '/'

export default defineConfig({
  base: BASE,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Groove Grid',
        short_name: 'Groove Grid',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#F7F3EA',
        background_color: '#F7F3EA',
        start_url: BASE,
        scope: BASE,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wav}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'spike/**/*.test.ts'],
  },
})
