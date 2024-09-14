<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- Top panel for route management -->
    <div class="p-4 bg-white shadow-md">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Bus Route Manager</h1>
      
      <div class="flex flex-wrap items-center gap-4 mb-4">
        <!-- Route selection -->
        <select v-model="selectedRouteId" class="p-2 border rounded flex-grow">
          <option value="">Select a route</option>
          <option v-for="route in routes" :key="route.id" :value="route.id">
            {{ route.name }}
          </option>
        </select>
        
        <!-- Action buttons -->
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
      
      <!-- Route details and stop list -->
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
    
    <!-- Map panel -->
    <div class="flex-grow relative">
      <div id="map" class="w-full h-full"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useNuxtApp } from '#app'

// Mocking draggable component for this example
const draggable = {
  name: 'draggable',
  template: '<div><slot></slot></div>'
}

// Sample data (replace with your actual data fetching logic)
const routes = ref([
  { id: 1, name: 'Route 1', stops: [
    { id: 1, name: 'Stop A', lat: 40.7128, lng: -74.0060 },
    { id: 2, name: 'Stop B', lat: 40.7282, lng: -73.7949 },
  ]},
  { id: 2, name: 'Route 2', stops: [
    { id: 3, name: 'Stop C', lat: 40.7489, lng: -73.9680 },
    { id: 4, name: 'Stop D', lat: 40.7589, lng: -73.9851 },
  ]},
])

const selectedRouteId = ref(null)
const selectedRoute = computed(() => routes.value.find(r => r.id === selectedRouteId.value))
const originalRoute = ref(null)
const map = ref(null)
const routeLine = ref(null)
const { $L } = useNuxtApp()

const hasChanges = computed(() => {
  if (!selectedRoute.value || !originalRoute.value) return false
  return JSON.stringify(selectedRoute.value) !== JSON.stringify(originalRoute.value)
})

onMounted(() => {
  if (process.client) {
    initMap()
  }
})

function initMap() {
  if (!map.value) {
    map.value = $L.map('map').setView([40.7128, -74.0060], 10)
    $L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.value)
  }
}

function updateMapView() {
  if (selectedRoute.value && map.value) {
    const bounds = $L.latLngBounds(selectedRoute.value.stops.map(stop => [stop.lat, stop.lng]))
    map.value.fitBounds(bounds)

    if (routeLine.value) {
      map.value.removeLayer(routeLine.value)
    }

    routeLine.value = $L.polyline(selectedRoute.value.stops.map(stop => [stop.lat, stop.lng]), {
      color: 'blue'
    }).addTo(map.value)

    selectedRoute.value.stops.forEach(stop => {
      $L.marker([stop.lat, stop.lng])
        .addTo(map.value)
        .bindPopup(stop.name)
    })
  }
}

function clearMapView() {
  if (map.value) {
    if (routeLine.value) {
      map.value.removeLayer(routeLine.value)
    }
    map.value.eachLayer(layer => {
      if (layer instanceof $L.Marker || layer instanceof $L.Polyline) {
        map.value.removeLayer(layer)
      }
    })
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
</script>

<style>
@import 'leaflet/dist/leaflet.css';

/* Ensure the map container takes up the full height */
#map {
  min-height: 500px; /* Adjust this value as needed */
}
</style>