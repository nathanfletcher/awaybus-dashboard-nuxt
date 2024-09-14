import L from 'leaflet'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    const user = useSupabaseUser()

    if (!user.value) {
      console.warn('User is not authenticated. Leaflet initialization skipped.')
      return
    }

    // Make L available globally
    nuxtApp.provide('L', L)

    // No need to initialize the map here, we'll do it in the component
  }
})