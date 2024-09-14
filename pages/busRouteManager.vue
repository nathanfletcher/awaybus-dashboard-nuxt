<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <div class="p-4 bg-white shadow-md">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Bus Route Manager</h1>
      
      <div class="flex flex-wrap items-center gap-4 mb-4">
        <select v-model="selectedRouteId" class="p-2 border rounded flex-grow">
          <option value="">Select a route</option>
          <option v-for="route in routes" :key="route.osm_id" :value="route.osm_id">
            {{ route.name || route.ref || 'Unnamed Route' }}
          </option>
        </select>
        
        <button @click="saveRoute" class="bg-blue-500 text-white px-4 py-2 rounded" :disabled="!hasChanges">
          Save Changes
        </button>
        <button @click="undoChanges" class="bg-gray-500 text-white px-4 py-2 rounded" :disabled="!hasChanges">
          Undo Changes
        </button>
        <button @click="createNewRoute" class="bg-green-500 text-white px-4 py-2 rounded">
          Create New Route
        </button>
        <button v-if="selectedRoute" @click="deleteRoute" class="bg-red-500 text-white px-4 py-2 rounded">
          Delete Route
        </button>
      </div>
      
      <div v-if="selectedRoute" class="mb-4">
        <input v-model="selectedRoute.name" class="w-full p-2 border rounded mb-2" placeholder="Route name" />
        <draggable v-model="selectedRoute.stops" item-key="id" handle=".handle" @end="onReorder" class="max-h-40 overflow-y-auto">
          <template #item="{ element }">
            <div class="flex items-center mb-2 bg-gray-100 p-2 rounded shadow">
              <span class="handle cursor-move mr-2">☰</span>
              <span>{{ element.name }}</span>
              <button @click="removeStop(element)" class="ml-auto text-red-500">×</button>
            </div>
          </template>
        </draggable>
      </div>
    </div>
    
    <div class="flex-grow relative">
      <div id="map" class="w-full h-full"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useNuxtApp } from '#app'
import { useSupabaseClient } from '#imports'

const draggable = {
  name: 'draggable',
  template: '<div><slot></slot></div>'
}

const supabase = useSupabaseClient()
const routes = ref([])
const selectedRouteId = ref(null)
const selectedRoute = computed(() => routes.value.find(r => r.osm_id === selectedRouteId.value))
const originalRoute = ref(null)
const map = ref(null)
const markers = ref([])
const { $L } = useNuxtApp()

const hasChanges = computed(() => {
  if (!selectedRoute.value || !originalRoute.value) return false
  return JSON.stringify(selectedRoute.value) !== JSON.stringify(originalRoute.value)
})

onMounted(async () => {
  if (process.client) {
    await nextTick()
    initMap()
    await fetchRoutes()
  }
})

async function fetchRoutes() {
  try {
    const { data, error } = await supabase
      .from('awayBusRoutes')
      .select('osm_id, name, ref, busStops')
    
    if (error) throw error
    
    routes.value = data
  } catch (error) {
    console.error('Error fetching routes:', error.message)
  }
}

function initMap() {
  if (!map.value) {
    nextTick(() => {
      map.value = $L.map('map').setView([0, 0], 2)
      $L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.value)
    })
  }
}

async function updateMapView() {
  if (selectedRoute.value && map.value) {
    clearMapView()
    
    let busStops;
    try {
      busStops = JSON.parse(selectedRoute.value.busStops).stops;
    } catch (e) {
      console.error('Failed to parse busStops:', e);
      busStops = [];
    }

    if (!Array.isArray(busStops)) {
      console.error('busStops is not an array:', busStops);
      busStops = [];
    }

    const stopsData = await fetchBusStops(busStops)
    
    if (stopsData.length === 0) {
      console.warn('No valid bus stops found for this route')
      return
    }

    const bounds = $L.latLngBounds()
    
    stopsData.forEach(stop => {
      if (stop.coordinates && stop.coordinates.length === 2) {
        const [lon, lat] = stop.coordinates
        const marker = $L.marker([lat, lon])
          .addTo(map.value)
          .bindPopup(`<b>${stop.name || 'Unnamed Stop'}</b><br>ID: ${stop.osm_id}`)
        
        marker.on('mouseover', function (e) {
          this.openPopup()
        })
        marker.on('mouseout', function (e) {
          this.closePopup()
        })
        
        markers.value.push(marker)
        bounds.extend([lat, lon])
      }
    })
    
    if (bounds.isValid()) {
      map.value.fitBounds(bounds)
    } else {
      console.warn('No valid bounds for the selected route')
      map.value.setView([0, 0], 2) // Set a default view
    }
  } else if (!map.value) {
    console.warn('Map not initialized yet')
    initMap()
  }
}

function clearMapView() {
  markers.value.forEach(marker => map.value.removeLayer(marker))
  markers.value = []
}

async function fetchBusStops(stopIds) {
  try {
    const { data, error } = await supabase
      .from('awayBusStops')
      .select('osm_id, "Name", geometry')
      .in('osm_id', stopIds)
    
    if (error) throw error
    
    return data.map(stop => {
      let coordinates;
      if (typeof stop.geometry === 'string') {
        try {
          coordinates = JSON.parse(stop.geometry).coordinates;
        } catch (e) {
          console.warn(`Failed to parse geometry for stop ${stop.osm_id}:`, e);
          coordinates = null;
        }
      } else if (typeof stop.geometry === 'object' && stop.geometry !== null) {
        coordinates = stop.geometry.coordinates;
      } else {
        console.warn(`Invalid geometry format for stop ${stop.osm_id}`);
        coordinates = null;
      }

      return {
        osm_id: stop.osm_id,
        name: stop.Name,
        coordinates: coordinates
      };
    }).filter(stop => stop.coordinates !== null);
  } catch (error) {
    console.error('Error fetching bus stops:', error.message);
    return [];
  }
}

function onReorder() {
  updateMapView()
}

function removeStop(stop) {
  if (selectedRoute.value) {
    const index = selectedRoute.value.stops.findIndex(s => s.id === stop.id)
    if (index !== -1) {
      selectedRoute.value.stops.splice(index, 1)
      updateMapView()
    }
  }
}

function saveRoute() {
  if (confirm('Are you sure you want to save these changes?')) {
    // Implement your save logic here
    originalRoute.value = JSON.parse(JSON.stringify(selectedRoute.value))
    alert('Changes saved successfully!')
  }
}

function undoChanges() {
  if (confirm('Are you sure you want to undo all changes?')) {
    selectedRoute.value = JSON.parse(JSON.stringify(originalRoute.value))
    updateMapView()
  }
}

function createNewRoute() {
  const newRoute = {
    id: Date.now(),
    name: 'New Route',
    stops: []
  }
  routes.value.push(newRoute)
  selectedRouteId.value = newRoute.id
}

function deleteRoute() {
  if (confirm('Are you sure you want to delete this route?')) {
    const index = routes.value.findIndex(r => r.id === selectedRoute.value.id)
    if (index !== -1) {
      routes.value.splice(index, 1)
      selectedRouteId.value = null
      clearMapView()
    }
  }
}

watch(selectedRouteId, async (newId) => {
  if (newId) {
    updateMapView()
  } else {
    clearMapView()
  }
})
</script>

<style>
@import 'leaflet/dist/leaflet.css';

#map {
  min-height: 500px;
}
</style>