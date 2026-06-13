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
              <v-stepper v-model="step">
                <v-stepper-header>
                  <v-stepper-step :complete="step > 1" step="1">City Info</v-stepper-step>
                  <v-divider></v-divider>
                  <v-stepper-step :complete="step > 2" step="2">Set Boundary</v-stepper-step>
                  <v-divider></v-divider>
                  <v-stepper-step :complete="step > 3" step="3">Import Data</v-stepper-step>
                  <v-divider></v-divider>
                  <v-stepper-step step="4">Publish</v-stepper-step>
                </v-stepper-header>

                <v-stepper-items>
                  <!-- Step 1: City Info -->
                  <v-stepper-content step="1">
                    <v-text-field v-model="form.name" label="City Name" variant="outlined" density="compact" :rules="[v => !!v || 'Required']"></v-text-field>
                    <v-text-field v-model="form.country" label="Country" variant="outlined" density="compact" :rules="[v => !!v || 'Required']"></v-text-field>
                    <v-text-field v-model="form.region" label="Region/State" variant="outlined" density="compact"></v-text-field>
                    <div class="text-right mt-4">
                      <v-btn color="primary" @click="step = 2" :disabled="!form.name || !form.country">Next: Draw Bounds</v-btn>
                    </div>
                  </v-stepper-content>

                  <!-- Step 2: Bounding Box -->
                  <v-stepper-content step="2">
                    <p class="mb-2">Drag the map to set the city boundary. Click "Use Viewport" to capture the visible area.</p>
                    <div id="cityMap" style="height: 400px; border: 1px solid #ccc; border-radius: 8px;"></div>
                    <v-row class="mt-2">
                      <v-col cols="3" v-for="(v, key) in form.bounds" :key="key">
                        <v-text-field :model-value="v?.toFixed(4)" :label="key" variant="outlined" density="compact" readonly hide-details></v-text-field>
                      </v-col>
                    </v-row>
                    <div class="d-flex justify-end mt-4">
                      <v-btn variant="text" @click="step = 1">Back</v-btn>
                      <v-btn color="secondary" variant="outlined" class="ml-2" @click="captureViewport">Use Viewport</v-btn>
                      <v-btn color="primary" class="ml-2" @click="step = 3" :disabled="!form.bounds">Next: Import</v-btn>
                    </div>
                  </v-stepper-content>

                  <!-- Step 3: Import Preview -->
                  <v-stepper-content step="3">
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
                          Import failed: {{ importResult.error }}
                        </template>
                      </v-alert>
                      <div v-if="importResult.stops_imported > 0" class="mb-4">
                        <p><strong>Bus Stops:</strong> {{ importResult.stops_imported }}</p>
                        <p><strong>Routes:</strong> {{ importResult.routes_imported || 0 }}</p>
                        <p class="text-caption"><strong>Import ID:</strong> {{ importResult.import_id }}</p>
                      </div>
                    </div>
                    <div class="d-flex justify-end mt-4">
                      <v-btn variant="text" @click="step = 2">Back</v-btn>
                      <v-btn v-if="!importResult" color="primary" class="ml-2" @click="runImport" :loading="importing" :disabled="importing">Start Import</v-btn>
                      <v-btn v-else-if="importResult?.success" color="primary" class="ml-2" @click="step = 4">Next: Publish</v-btn>
                    </div>
                  </v-stepper-content>

                  <!-- Step 4: Publish -->
                  <v-stepper-content step="4">
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
                      <v-btn variant="text" @click="step = 3">Back</v-btn>
                    </div>
                  </v-stepper-content>
                </v-stepper-items>
              </v-stepper>
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

const form = ref({
  name: '',
  country: '',
  region: '',
  bounds: null,
})

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
  
  // Draw rectangle
  const bounds = L.rectangle([[5.55, -0.35], [5.70, -0.10]], {
    color: '#008080', weight: 2, fillOpacity: 0.1
  }).addTo(cityMap)
  
  cityMap.on('moveend', () => {
    const b = cityMap.getBounds()
    form.value.bounds = {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    }
  })
}

function captureViewport() {
  const b = cityMap.getBounds()
  form.value.bounds = {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  }
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
    }).catch(() => null)

    if (response?.success) {
      importResult.value = response
      step.value = 4
    } else {
      importResult.value = { success: false, error: 'Import failed. Check Supabase Edge Function logs.' }
    }
  } catch (e) {
    importResult.value = { success: false, error: e.message }
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
    }).catch(() => null)

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
