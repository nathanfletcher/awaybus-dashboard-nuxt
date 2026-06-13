<template>
  <v-dialog v-model="showSearch" max-width="600">
    <template v-slot:activator="{ props }">
      <v-btn icon="mdi-magnify" variant="text" v-bind="props" @click="showSearch = true"></v-btn>
    </template>
    <v-card>
      <v-card-text class="pt-4">
        <v-text-field
          v-model="query"
          label="Search stops, routes, drivers..."
          variant="outlined"
          density="compact"
          autofocus
          hide-details
          @input="doSearch"
          prepend-inner-icon="mdi-magnify"
        ></v-text-field>
        
        <v-list v-if="results.length > 0 && query.length >= 1" class="mt-2" density="compact">
          <v-list-item
            v-for="(item, i) in results.slice(0, 15)"
            :key="i"
            :to="item._link"
            @click="showSearch = false"
          >
            <template v-slot:prepend>
              <v-icon :icon="item._icon" size="small"></v-icon>
            </template>
            <v-list-item-title>{{ item._display }}</v-list-item-title>
            <v-list-item-subtitle>{{ item._type }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <p v-if="query.length >= 1 && results.length === 0 && !searching" class="text-grey text-center mt-4">
          No results found
        </p>
        <p v-if="searching" class="text-grey text-center mt-4">Searching...</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const client = useSupabaseClient()
const showSearch = ref(false)
const query = ref('')
const results = ref([])
const searching = ref(false)

let debounceTimer = null

function doSearch() {
  clearTimeout(debounceTimer)
  if (query.value.length < 1) {
    results.value = []
    return
  }
  
  searching.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const q = `%${query.value}%`
      const all = []

      // Search stops
      const { data: stops } = await client.from('awayBusStops').select('osm_id, Name').ilike('Name', q).limit(5)
      if (stops) all.push(...stops.map(s => ({
        _display: s.Name || 'Unnamed',
        _type: 'Bus Stop',
        _icon: 'mdi-bus-stop',
        _link: '/stops',
      })))

      // Search routes
      const { data: routes } = await client.from('awayBusRoutes').select('osm_id, name').ilike('name', q).limit(5)
      if (routes) all.push(...routes.map(r => ({
        _display: r.name || 'Unnamed',
        _type: 'Route',
        _icon: 'mdi-map-marker-path',
        _link: '/routes',
      })))

      // Search drivers
      const { data: drivers } = await client.from('awayBusDrivers').select('id, name, carNumber').or(`name.ilike.${q},carNumber.ilike.${q}`).limit(5)
      if (drivers) all.push(...drivers.map(d => ({
        _display: `${d.name || 'Unknown'} (${d.carNumber || 'N/A'})`,
        _type: 'Driver',
        _icon: 'mdi-steering',
        _link: '/drivers',
      })))

      results.value = all
    } catch (e) {
      console.error('Search error:', e)
    }
    searching.value = false
  }, 300)
}
</script>
