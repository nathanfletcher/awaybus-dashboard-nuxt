// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxtjs/supabase','@invictus.codes/nuxt-vuetify', '@vite-pwa/nuxt'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'AwayBus Station Master',
      short_name: 'AwayBus',
      theme_color: '#008080',
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
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallbackAllowlist: [/^\/(login|forgot-password|new-password|cities|staff|audit-log|drivers|users|stops|routes|simulator)?$/],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/]
    }
  },
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#008080',
              secondary: '#FFD700',
              error: '#D32F2F',
              warning: '#F9A825',
              info: '#0097A7',
              success: '#008080',
              background: '#FFFFFF',
              surface: '#FFFFFF',
              'on-surface': '#121212',
              'on-primary': '#FFFFFF',
              'on-secondary': '#121212',
            }
          },
          dark: {
            dark: true,
            colors: {
              primary: '#00B3B3',
              secondary: '#FFD700',
              error: '#EF5350',
              warning: '#F9A825',
              info: '#26C6DA',
              success: '#00B3B3',
              background: '#121212',
              surface: '#1E1E1E',
              'on-surface': '#FFFFFF',
              'on-primary': '#FFFFFF',
              'on-secondary': '#121212',
            }
          }
        }
      }
    },
    moduleOptions: {
      treeshaking: true,
      useIconCDN: true,
      styles: true,
      autoImport: true,
      useVuetifyLabs: true,
    }
  },
  css: ['leaflet/dist/leaflet.css'],
})
