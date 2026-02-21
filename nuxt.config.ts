// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxtjs/supabase','@invictus.codes/nuxt-vuetify', '@vite-pwa/nuxt'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_KEY,
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'AwayBus Station Master',
      short_name: 'AwayBus',
      theme_color: '#1976d2',
      icons: [
        {
          src: 'favicon.ico',
          sizes: '64x64 32x32 24x24 16x16',
          type: 'image/x-icon'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/]
    }
  },
  vuetify: {
    vuetifyOptions: {
      // @vuetify/vite-plugin
    },
    moduleOptions: {
      treeshaking: true,
      useIconCDN: true,
      styles: true,
      autoImport: true,
    }
  },
  css: ['leaflet/dist/leaflet.css'],
})
