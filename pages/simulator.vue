<template>
  <div>
    <v-container>
      <v-row class="mb-4">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Driver Simulator</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Simulate drivers moving along routes to test real-time tracking. <v-chip v-if="sim.running.value" size="small" color="success" class="ml-2">Running</v-chip></p>
        </v-col>
      </v-row>

      <!-- Controls -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>Simulation Controls</v-card-title>
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="driverCount"
                    :items="[1,2,3,5,10,15,20]"
                    label="Number of Drivers"
                    variant="outlined"
                    density="compact"
                    :disabled="sim.running.value"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="routeFilter"
                    :items="routeOptions"
                    label="Routes (auto-assign if none)"
                    variant="outlined"
                    density="compact"
                    multiple
                    clearable
                    :disabled="sim.running.value"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="2">
                  <v-select
                    v-model="speed"
                    :items="speedOptions"
                    label="Speed"
                    variant="outlined"
                    density="compact"
                    :disabled="sim.running.value"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="2">
                  <v-switch
                    v-model="simulateDemand"
                    label="Simulate Demand"
                    color="warning"
                    density="compact"
                    hide-details
                    :disabled="sim.running.value"
                  ></v-switch>
                </v-col>
                <v-col cols="12" sm="2" class="d-flex align-center">
                  <v-btn
                    v-if="!sim.running.value"
                    color="success"
                    prepend-icon="mdi-play"
                    @click="startSimulation"
                    :disabled="!driverCount"
                    block
                  >Start</v-btn>
                  <v-btn
                    v-else
                    color="error"
                    prepend-icon="mdi-stop"
                    @click="sim.stop()"
                    block
                  >Stop</v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Stats -->
      <v-row class="mt-4" v-if="sim.stats.active > 0">
        <v-col cols="6" sm="2">
          <v-card color="success" theme="dark">
            <v-card-text class="text-center">
              <div class="text-overline">Active</div>
              <div class="text-h3">{{ sim.stats.active }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="2">
          <v-card color="primary" theme="dark">
            <v-card-text class="text-center">
              <div class="text-overline">Ticks</div>
              <div class="text-h3">{{ sim.stats.ticks }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="2">
          <v-card color="info" theme="dark">
            <v-card-text class="text-center">
              <div class="text-overline">Routes</div>
              <div class="text-h3">{{ sim.stats.routesUsed }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="warning" theme="dark">
            <v-card-text class="text-center">
              <div class="text-overline">Check‑ins Created</div>
              <div class="text-h3">{{ sim.stats.checkInsCreated }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="teal-darken-2" theme="dark">
            <v-card-text class="text-center">
              <div class="text-overline">Demand / Cleared</div>
              <div class="text-h3">{{ sim.stats.demandCreated }} / {{ sim.stats.checkInsCleared }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Map + Driver List -->
      <v-row class="mt-4">
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="bg-grey-lighten-3">Live Simulation Map</v-card-title>
            <v-card-text class="pa-0">
              <div id="simulatorMap" style="height: 450px; width: 100%;"></div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="fill-height">
            <v-card-title class="bg-grey-lighten-3">Active Drivers</v-card-title>
            <v-card-text style="max-height: 450px; overflow-y: auto;">
              <v-list v-if="sim.activeDrivers.length > 0" density="compact">
                <v-list-item v-for="d in sim.activeDrivers" :key="d.id">
                  <template v-slot:prepend>
                    <v-avatar :color="d._color" size="24">
                      <v-icon size="14" icon="mdi-steering"></v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2">{{ d.name || 'Driver ' + d.id }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ d._routeName || 'No route' }} · Stop {{ d._stopIndex + 1 }}/{{ d._totalStops }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip size="x-small" :color="d._moving ? 'success' : 'grey'">{{ d._moving ? 'Moving' : 'Paused' }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <p v-else class="text-center text-grey py-4">No active simulation</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

definePageMeta({ middleware: 'auth', layout: 'default' })
useHead({ title: 'Driver Simulator | AwayBus' })

const sim = useSimulator()
const client = useSupabaseClient()

// Local UI state — initialised from composable's last config
const driverCount = ref(sim.lastDriverCount.value)
const routeFilter = ref([...sim.lastRouteFilter.value])
const speed = ref(sim.lastSpeed.value)
const simulateDemand = ref(sim.lastSimulateDemand.value)

const speedOptions = [
  { title: 'Slow (3s/tick)', value: 'slow' },
  { title: 'Normal (1s/tick)', value: 'normal' },
  { title: 'Fast (300ms/tick)', value: 'fast' },
  { title: 'Ultra (100ms/tick)', value: 'ultra' },
]

// Routes dropdown (loaded on mount)
const allRoutes = ref([])
const routeOptions = computed(() =>
  allRoutes.value.filter(r => r.name).slice(0, 50).map(r => ({ title: r.name || `Route ${r.osm_id}`, value: r.osm_id }))
)

// Map state — re-created on each mount since it's DOM-bound
let mapInstance = null
let driverMarkers = []
let mapRefreshTimer = null

onMounted(async () => {
  // Load routes for the dropdown
  const { data } = await client.from('awayBusRoutes').select('osm_id, name').limit(100)
  if (data) allRoutes.value = data

  // Init map
  await initMap()

  // If simulation is already running, start map refresh
  if (sim.running.value) {
    startMapRefresh()
  }
})

onBeforeUnmount(() => {
  // Stop the map refresh (but NOT the simulation)
  stopMapRefresh()
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

async function startSimulation() {
  await sim.start({
    driverCount: driverCount.value,
    routeFilter: routeFilter.value,
    speed: speed.value,
    simulateDemand: simulateDemand.value,
  })
  await initMap()
  startMapRefresh()
}

// ── Map helpers ─────────────────────────────────────────
async function initMap() {
  if (!process.client) return
  const L = await import('leaflet')

  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  const mapEl = document.getElementById('simulatorMap')
  if (!mapEl) return

  mapInstance = L.map('simulatorMap').setView([5.6037, -0.1870], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(mapInstance)

  updateMapMarkers()
}

function startMapRefresh() {
  stopMapRefresh()
  mapRefreshTimer = setInterval(updateMapMarkers, 1000)
}

function stopMapRefresh() {
  if (mapRefreshTimer) {
    clearInterval(mapRefreshTimer)
    mapRefreshTimer = null
  }
  clearMapMarkers()
}

function updateMapMarkers() {
  if (!mapInstance || !process.client) return
  import('leaflet').then(L => {
    driverMarkers.forEach(m => { try { mapInstance.removeLayer(m) } catch (_) {} })
    driverMarkers = []

    for (const driver of sim.activeDrivers) {
      if (!driver._lat || !driver._lng) continue

      const icon = L.divIcon({
        html: `<div style="background:${driver._color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:bold">${String(driver.id).slice(-2)}</div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const marker = L.marker([driver._lat, driver._lng], { icon })
        .bindPopup(`<strong>${driver.name || 'Driver ' + driver.id}</strong><br>${driver._routeName}<br>Stop ${driver._stopIndex + 1}/${driver._totalStops}`)
        .addTo(mapInstance)
      driverMarkers.push(marker)
    }
  })
}

function clearMapMarkers() {
  driverMarkers.forEach(m => { try { m.remove() } catch (_) {} })
  driverMarkers = []
}
</script>
