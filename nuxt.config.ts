// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxtjs/supabase','@invictus.codes/nuxt-vuetify',],
  css: [
    'leaflet/dist/leaflet.css'
  ],
})
