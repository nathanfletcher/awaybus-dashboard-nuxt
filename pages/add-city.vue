<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Add New City</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Import bus stops and routes from OpenStreetMap.</p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-text>
              <p class="text-overline text-primary mb-1">Step {{ step }} of 4</p>
              <p class="text-h6 font-weight-medium mb-6">{{ steps[step - 1] }}</p>

              <!-- Step 1: City Info -->
              <div v-if="step === 1">
                <v-text-field v-model="form.name" label="City Name" variant="outlined" density="compact" :rules="[v => !!v || 'Required']"></v-text-field>
                <v-text-field v-model="form.country" label="Country" variant="outlined" density="compact" :rules="[v => !!v || 'Required']"></v-text-field>
                <v-text-field v-model="form.region" label="Region/State" variant="outlined" density="compact"></v-text-field>
                <div class="text-right mt-4">
                  <v-btn color="primary" @click="step = 2" :disabled="!form.name || !form.country">Next: Draw Bounds</v-btn>
                </div>
              </div>

              <!-- Step 2: Bounding Box -->
              <div v-if="step === 2">
                <v-alert color="info" variant="tonal" density="compact" class="mb-4" icon="mdi-information-outline">
                  <strong>Zoom and pan</strong> the map to frame the city area. The bounding box coordinates update automatically — you don't need to click anything. When the city fits comfortably in the view, click <strong>"Next: Import"</strong>.
                </v-alert>

                <div id="cityMap" style="height: 400px; border: 1px solid #ccc; border-radius: 8px;"></div>

                <v-row class="mt-2">
                  <v-col cols="3" v-for="(v, key) in form.bounds" :key="key">
                    <v-text-field :model-value="v?.toFixed(4)" :label="key" variant="outlined" density="compact" readonly hide-details></v-text-field>
                  </v-col>
                </v-row>

                <v-chip v-if="form.bounds" color="success" size="small" variant="tonal" class="mt-2" prepend-icon="mdi-check-circle">
                  Bounds captured — {{ form.bounds.north?.toFixed(4) }}°N, {{ form.bounds.south?.toFixed(4) }}°S, {{ form.bounds.east?.toFixed(4) }}°E, {{ form.bounds.west?.toFixed(4) }}°W
                </v-chip>

                <div class="d-flex justify-end mt-4">
                  <v-btn variant="outlined" color="grey-darken-1" prepend-icon="mdi-arrow-left" @click="step = 1">Back</v-btn>
                  <v-btn color="primary" class="ml-2" @click="step = 3" :disabled="!form.bounds">Next: Import</v-btn>
                </div>
              </div>

              <!-- Step 3: Import Preview -->
              <div v-if="step === 3">
                <div v-if="importing" class="text-center py-8">
                  <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
                  <p class="mt-4">Querying OpenStreetMap for {{ form.name }}...</p>
                </div>
                <div v-else-if="importResult">
                  <v-alert :type="importResult.success ? 'success' : 'error'" variant="tonal" class="mb-4">
                    <template v-if="importResult.success">
                      Found {{ importResult.stops_imported }} bus stops in {{ form.name }}.
                    </template>
                    <template v-else>
                      <p class="font-weight-bold mb-2">Import failed</p>
                      <p class="mb-2">{{ importResult.error }}</p>
                      <div v-if="importResult.hint" class="text-caption mt-2" style="white-space: pre-line">
                        <v-icon size="small" class="mr-1">mdi-lightbulb-outline</v-icon>
                        {{ importResult.hint }}
                      </div>
                    </template>
                  </v-alert>
                  <div v-if="importResult.stops_imported > 0" class="mb-4">
                    <p><strong>Bus Stops:</strong> {{ importResult.stops_imported }}</p>
                    <p><strong>Routes:</strong> {{ importResult.routes_imported || 0 }}</p>
                    <p class="text-caption"><strong>Import ID:</strong> {{ importResult.import_id }}</p>
                  </div>
                </div>
                <div class="d-flex justify-end mt-4">
                  <v-btn variant="outlined" color="grey-darken-1" prepend-icon="mdi-arrow-left" @click="step = 2">Back</v-btn>
                  <v-btn v-if="!importResult" color="primary" class="ml-2" @click="runImport" :loading="importing" :disabled="importing">Start Import</v-btn>
                  <v-btn v-else-if="importResult?.success" color="primary" class="ml-2" @click="step = 4">Next: Publish</v-btn>
                </div>
              </div>

              <!-- Step 4: Publish -->
              <div v-if="step === 4">
                <div v-if="publishing" class="text-center py-8">
                  <v-progress-circular indeterminate size="64" color="success"></v-progress-circular>
                  <p class="mt-4">Publishing {{ form.name }}...</p>
                </div>
                <div v-else-if="publishResult">
                  <v-alert :type="publishResult?.success ? 'success' : 'error'" variant="tonal" class="mb-4">
                    <template v-if="publishResult?.success">
                      {{ form.name }} is now live with {{ importResult?.stops_imported || 0 }} stops!
                    </template>
                    <template v-else>
                      Publish failed: {{ publishResult?.error }}
                    </template>
                  </v-alert>
                  <div v-if="publishResult?.success" class="text-center">
                    <v-btn color="primary" to="/cities">Go to Cities</v-btn>
                  </div>
                </div>
                <div v-else>
                  <p class="mb-4">Ready to publish. This will activate the city and make its stops and routes live.</p>
                  <div class="text-center">
                    <v-btn color="success" size="large" @click="publishCity" :loading="publishing">Publish {{ form.name }}</v-btn>
                  </div>
                </div>
                <div class="text-left mt-4">
                  <v-btn variant="outlined" color="grey-darken-1" prepend-icon="mdi-arrow-left" @click="step = 3">Back</v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

definePageMeta({ middleware: 'auth', layout: 'default' })

const client = useSupabaseClient()
const step = ref(1)
const importing = ref(false)
const publishing = ref(false)
const importResult = ref(null)
const publishResult = ref(null)

let cityMap = null

const steps = [
  'City Info — Enter the city name and location.',
  'Set Boundary — Zoom and pan the map to frame the city.',
  'Import Data — Fetch bus stops from OpenStreetMap.',
  'Publish — Make the city live in the system.',
]

const form = ref({
  name: '',
  country: '',
  region: '',
  bounds: null,
})

function captureBounds(map) {
  const b = map.getBounds()
  form.value.bounds = {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  }
}

async function initMap() {
  await nextTick()
  const L = await import('leaflet')

  if (cityMap) cityMap.remove()

  // Default to Accra view
  cityMap = L.map('cityMap').setView([5.6037, -0.1870], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(cityMap)

  // Draw draggable rectangle
  const rect = L.rectangle([[5.55, -0.35], [5.70, -0.10]], {
    color: '#008080', weight: 2, fillOpacity: 0.1
  }).addTo(cityMap)

  // Capture bounds immediately (don't wait for user to move the map)
  captureBounds(cityMap)

  // Auto-update on every pan/zoom
  cityMap.on('moveend', () => captureBounds(cityMap))
}

async function runImport() {
  importing.value = true
  try {
    const response = await $fetch('/api/osm-import', {
      method: 'POST',
      body: {
        city_name: form.value.name,
        country: form.value.country,
        bounding_box: form.value.bounds,
      },
    })

    if (response?.success) {
      importResult.value = response
    } else {
      importResult.value = {
        success: false,
        error: response?.error || 'Import failed. Check Supabase Edge Function logs.',
        hint: 'The OSM import edge function may not be running. From the AwayBusSupabase directory, run: supabase functions serve osm-import --no-verify-jwt',
      }
    }
  } catch (e) {
    const status = e?.statusCode || e?.response?.status
    if (status === 503 || status === 502) {
      importResult.value = {
        success: false,
        error: 'The OSM import service is not reachable.',
        hint: 'Start the edge function locally:\ncd AwayBusSupabase && supabase functions serve osm-import --no-verify-jwt\n\nOr deploy to production:\nsupabase functions deploy osm-import',
      }
    } else {
      importResult.value = {
        success: false,
        error: e?.message || e?.data?.message || 'Connection failed',
        hint: 'Check that the Supabase project is running and the osm-import edge function is deployed.',
      }
    }
  }
  importing.value = false
}

async function publishCity() {
  publishing.value = true
  try {
    const response = await $fetch('/api/publish-city', {
      method: 'POST',
      body: {
        city_id: importResult.value?.city_id,
      },
    })

    if (response?.success) {
      publishResult.value = response
    } else {
      publishResult.value = { success: false, error: 'Publish failed. Check Supabase logs.' }
    }
  } catch (e) {
    publishResult.value = { success: false, error: e.message }
  }
  publishing.value = false
}

watch(step, async (newStep) => {
  if (newStep === 2) await initMap()
})

onMounted(() => {
  if (step.value === 2) initMap()
})
</script>
