// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxtjs/supabase','@invictus.codes/nuxt-vuetify',],
  css: [
    'leaflet/dist/leaflet.css'
  ],
  // Remove the plugins array if it's empty after removing vuedraggable
  // plugins: [],
  // Remove the build.transpile option if it's only for vuedraggable
  // build: {
  //   transpile: []
  // },
})
