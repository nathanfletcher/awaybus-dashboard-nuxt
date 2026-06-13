<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Cities</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Manage cities for multi-city rollout.</p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>Active Cities</span>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="cities"
                :loading="loading"
              >
                <template v-slot:item.is_active="{ item }">
                  <v-chip :color="item.is_active ? 'success' : 'grey'" size="small">
                    {{ item.is_active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </template>
                <template v-slot:item.stop_count="{ item }">
                  {{ item._stopCount || '—' }}
                </template>
                <template v-slot:item.route_count="{ item }">
                  {{ item._routeCount || '—' }}
                </template>
                <template v-slot:item.created_at="{ item }">
                  {{ new Date(item.created_at).toLocaleDateString() }}
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'auth', layout: 'default' })

const client = useSupabaseClient()
const loading = ref(false)
const cities = ref([])

const headers = [
  { title: 'City', key: 'name', sortable: true },
  { title: 'Country', key: 'country', sortable: true },
  { title: 'Region', key: 'region' },
  { title: 'Status', key: 'is_active', sortable: true },
  { title: 'Stops', key: 'stop_count', sortable: false },
  { title: 'Routes', key: 'route_count', sortable: false },
  { title: 'Created', key: 'created_at', sortable: true },
]

async function loadCities() {
  loading.value = true
  try {
    const { data } = await client.from('cities').select('*').order('name')
    if (data) {
      // Fetch stop/route counts per city
      for (const city of data) {
        const { count: stops } = await client.from('awayBusStops').select('*', { count: 'exact', head: true }).eq('city_id', city.id)
        const { count: routes } = await client.from('awayBusRoutes').select('*', { count: 'exact', head: true }).eq('city_id', city.id)
        city._stopCount = stops || 0
        city._routeCount = routes || 0
      }
      cities.value = data
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadCities)
</script>
