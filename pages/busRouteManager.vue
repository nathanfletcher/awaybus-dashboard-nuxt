<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- Top panel for route selection and buttons -->
    <div class="p-4 bg-white shadow-md">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Bus Route Manager</h1>
      
      <div class="flex flex-wrap items-center gap-4 mb-4">
        <select v-model="selectedRouteId" class="p-2 border rounded flex-grow">
          <option value="">Select a route</option>
          <option v-for="route in routes" :key="route.osm_id" :value="route.osm_id">
            {{ route.name || route.ref || 'Unnamed Route' }}
          </option>
        </select>
        
        <button @click="saveRouteOrder" class="bg-blue-500 text-white px-4 py-2 rounded font-bold" :disabled="!hasChanges">
          Save Changes
        </button>
        <button @click="undoChanges" class="bg-gray-500 text-white px-4 py-2 rounded font-bold" :disabled="!hasChanges">
          Undo Changes
        </button>
      </div>
    </div>
    
    <!-- Main content area -->
    <div class="flex flex-grow overflow-hidden">
      <!-- Left side panel for bus stops list -->
      <div v-if="selectedRoute" class="w-1/4 bg-white shadow-md overflow-y-auto p-4">
        <h2 class="text-lg font-semibold mb-2">Bus Stops</h2>
        <div class="space-y-2">
          <div
            v-for="(stop, index) in busStops"
            :key="stop.osm_id"
            class="flex items-center p-2 bg-gray-100 rounded shadow cursor-move"
            draggable="true"
            @dragstart="startDrag($event, index)"
            @dragover.prevent
            @dragenter.prevent
            @drop="onDrop($event, index)"
          >
            <span class="mr-2">☰</span>
            <span class="font-medium">{{ stop.name || 'Unnamed Stop' }} (ID: {{ stop.osm_id }})</span>
          </div>
        </div>
      </div>
      
      <!-- Map panel -->
      <div class="flex-grow">
        <div id="map" class="w-full h-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useNuxtApp } from '#app'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const routes = ref([])
const selectedRouteId = ref(null)
const selectedRoute = computed(() => routes.value.find(r => r.osm_id === selectedRouteId.value))
const originalBusStops = ref([])
const busStops = ref([])
const map = ref(null)
const markers = ref([])
const { $L } = useNuxtApp()

const hasChanges = computed(() => {
  return JSON.stringify(busStops.value) !== JSON.stringify(originalBusStops.value)
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
    
    const bounds = $L.latLngBounds()
    const routeCoordinates = []
    
    busStops.value.forEach((stop, index) => {
      if (stop.coordinates && stop.coordinates.length === 2) {
        const [lon, lat] = stop.coordinates
        let markerIcon

        if (index === 0) {
          markerIcon = $L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#4CAF50;' class='marker-pin'></div><i class='material-icons'>play_arrow</i>",
            iconSize: [30, 42],
            iconAnchor: [15, 42]
          })
        } else if (index === busStops.value.length - 1) {
          markerIcon = $L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#F44336;' class='marker-pin'></div><i class='material-icons'>stop</i>",
            iconSize: [30, 42],
            iconAnchor: [15, 42]
          })
        } else {
          markerIcon = $L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#2196F3;' class='marker-pin'></div><i class='material-icons'>place</i>",
            iconSize: [30, 42],
            iconAnchor: [15, 42]
          })
        }

        const marker = $L.marker([lat, lon], { icon: markerIcon })
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
        routeCoordinates.push([lat, lon])
      }
    })
    
    if (routeCoordinates.length > 1) {
      const routeLine = $L.polyline(routeCoordinates, {color: 'red', weight: 3}).addTo(map.value)
      markers.value.push(routeLine)
    }
    
    if (bounds.isValid()) {
      map.value.fitBounds(bounds)
    } else {
      console.warn('No valid bounds for the selected route')
      map.value.setView([0, 0], 2)
    }
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
        name: stop.Name || `Stop ${stop.osm_id}`,
        coordinates: coordinates
      };
    }).filter(stop => stop.coordinates !== null);
  } catch (error) {
    console.error('Error fetching bus stops:', error.message);
    return [];
  }
}

function startDrag(evt, index) {
  evt.dataTransfer.dropEffect = 'move'
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.setData('itemIndex', index.toString())
}

function onDrop(evt, newIndex) {
  const oldIndex = parseInt(evt.dataTransfer.getData('itemIndex'))
  if (oldIndex !== newIndex) {
    const itemToMove = busStops.value.splice(oldIndex, 1)[0]
    busStops.value.splice(newIndex, 0, itemToMove)
    onReorder()
  }
}

function onReorder() {
  updateMapView()
}

async function saveRouteOrder() {
  if (confirm('Are you sure you want to save these changes?')) {
    try {
      const updatedBusStops = { stops: busStops.value.map(stop => stop.osm_id) }
      const { error } = await supabase
        .from('awayBusRoutes')
        .update({ busStops: JSON.stringify(updatedBusStops) })
        .eq('osm_id', selectedRouteId.value)

      if (error) throw error

      originalBusStops.value = JSON.parse(JSON.stringify(busStops.value))
      alert('Changes saved successfully!')
    } catch (error) {
      console.error('Error saving route order:', error.message)
      alert('Failed to save changes. Please try again.')
    }
  }
}

function undoChanges() {
  if (confirm('Are you sure you want to undo all changes?')) {
    busStops.value = JSON.parse(JSON.stringify(originalBusStops.value))
    updateMapView()
  }
}

watch(selectedRouteId, async (newId) => {
  if (newId) {
    const route = routes.value.find(r => r.osm_id === newId)
    if (route) {
      let stopIds;
      try {
        stopIds = JSON.parse(route.busStops).stops;
      } catch (e) {
        console.error('Failed to parse busStops:', e);
        stopIds = [];
      }

      busStops.value = await fetchBusStops(stopIds)
      originalBusStops.value = JSON.parse(JSON.stringify(busStops.value))
      updateMapView()
    }
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

/* ... (keep other existing styles) ... */

/* New styles for layout */
.h-screen {
  height: 100vh;
}

.flex-grow {
  flex-grow: 1;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

.w-1/4 {
  width: 25%;
}

/* Ensure the map takes full height */
#map {
  height: 100%;
}
</style>