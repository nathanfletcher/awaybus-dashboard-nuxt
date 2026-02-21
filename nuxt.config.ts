// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxtjs/supabase','@invictus.codes/nuxt-vuetify',],
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
