<template>
  <div fluid class="pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <div class="text-h3 font-weight-bold">Bus Route Manager</div>
      <!-- Left panel for route management and bus stops list -->
      

      <!-- Right panel for map -->
      <v-col cols="9">
        <div id="map" style="height: 100vh;"></div>
      </v-col>
      <v-col cols="3" class="bg-grey-lighten-4">
        <v-card flat class="h-100">
          <v-card-title class="text-h5 font-weight-bold"></v-card-title>
          
          <v-card-text>
            <v-select
              v-model="selectedRouteId"
              :items="routes"
              item-title="name"
              item-value="osm_id"
              label="Select a route"
              class="mb-4"
            ></v-select>
            
            <v-btn-group v-if="hasChanges" size="small">
              <v-btn color="primary" @click="saveRouteOrder" density="comfortable">
                Save Changes
              </v-btn>
              <v-btn color="secondary" @click="undoChanges" density="comfortable">
                Undo
              </v-btn>
            </v-btn-group>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text v-if="selectedRoute" class="overflow-y-auto" style="max-height: calc(100vh - 250px);">
    <h3 class="text-h6 mb-2">Bus Stops</h3>
    <v-list density="compact">
      <div
        v-for="(stop, index) in busStops"
        :key="stop.osm_id"
        class="bus-stop-item"
      >
        <div
          class="drag-placeholder"
          :class="{ 'show': draggedIndex !== null && draggedIndex !== index }"
          @dragenter="onDragEnter(index)"
          @dragover.prevent
          @dragleave="onDragLeave"
        ></div>
        <v-list-item
          :title="stop.name || 'Unnamed Stop'"
          :subtitle="`ID: ${stop.osm_id}`"
          class="mb-2"
          draggable="true"
          @dragstart="startDrag($event, index)"
          @dragend="endDrag"
          @dragover.prevent
          @drop="onDrop($event, index)"
          :class="{ 'dragging': draggedIndex === index }"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-drag"></v-icon>
          </template>
        </v-list-item>
      </div>
    </v-list>
  </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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
    await fetchRoutes()
    await nextTick()
    initMap()
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
    map.value = $L.map('map').setView([0, 0], 2)
    $L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.value)
  }
}

async function updateMapView() {
  if (!map.value) {
    await nextTick()
    initMap()
  }

  if (selectedRoute.value && map.value) {
    clearMapView()
    
    const bounds = $L.latLngBounds()
    const routeCoordinates = []
    
    busStops.value.forEach((stop, index) => {
      if (stop.coordinates && stop.coordinates.length === 2) {
        const [lon, lat] = stop.coordinates
        let markerIcon = $L.icon({
          iconUrl: index === 0 ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' :
                   index === busStops.value.length - 1 ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' :
                   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })

        const marker = $L.marker([lat, lon], { icon: markerIcon })
          .addTo(map.value)
          .bindPopup(`<b>${stop.name || 'Unnamed Stop'}</b><br>ID: ${stop.osm_id}`)
        
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

const draggedIndex = ref(null)
const dropIndex = ref(null)

function startDrag(evt, index) {
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.setData('text/plain', index.toString())
  draggedIndex.value = index
}

function endDrag() {
  draggedIndex.value = null
  dropIndex.value = null
}

function onDragEnter(index) {
  if (index !== draggedIndex.value) {
    dropIndex.value = index
  }
}

function onDragLeave(evt) {
  if (!evt.currentTarget.contains(evt.relatedTarget)) {
    dropIndex.value = null
  }
}

function onDrop(evt, newIndex) {
  const oldIndex = parseInt(evt.dataTransfer.getData('text/plain'))
  if (oldIndex !== newIndex) {
    const itemToMove = busStops.value.splice(oldIndex, 1)[0]
    busStops.value.splice(newIndex, 0, itemToMove)
    onReorder()
  }
  endDrag()
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
      await updateMapView()
    }
  } else {
    clearMapView()
  }
})
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';

#map {
  height: 100%;
  width: 100%;
}

.fill-height {
  height: 100vh;
}

.h-100 {
  height: 100%;
}

/* Custom scrollbar for Webkit browsers */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.custom-div-icon {
  background: none;
  border: none;
}

.marker-pin {
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  position: absolute;
  transform: rotate(-45deg);
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -15px;
}

.marker-icon {
  position: absolute;
  width: 22px;
  font-size: 22px;
  left: 0;
  right: 0;
  top: 10px;
  text-align: center;
}

#map {
  height: 100vh;
  width: 100%;
}

.bus-stop-item {
  position: relative;
}

.drag-placeholder {
  height: 2px;
  background-color: #2196F3;
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.drag-placeholder.show {
  opacity: 1;
}

.v-list-item.dragging {
  opacity: 0.5;
}

.v-list-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.v-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

</style>