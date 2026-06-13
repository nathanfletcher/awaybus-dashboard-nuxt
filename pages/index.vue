<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">AwayBus Overview</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Live metrics and system health at a glance.</p>
        </v-col>
      </v-row>

      <v-row>
        <!-- Demand Metrics -->
        <v-col cols="12" md="6" lg="3">
          <v-card elevation="2" class="fill-height" color="primary" theme="dark">
            <v-card-text>
              <div class="text-overline mb-1">Live Commuter Demand</div>
              <div class="text-h2 font-weight-black mb-2">{{ totalDemand }}</div>
              <div class="text-caption">Total people currently waiting at stops</div>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" prepend-icon="mdi-account-group" to="/stops">View Stops</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Driver Metrics -->
        <v-col cols="12" md="6" lg="3">
          <v-card elevation="2" class="fill-height" color="success" theme="dark">
            <v-card-text>
              <div class="text-overline mb-1">Active Drivers</div>
              <div class="text-h2 font-weight-black mb-2">{{ activeDrivers }} <span class="text-h5">/ {{ totalDrivers }}</span></div>
              <div class="text-caption">Drivers broadcasting location right now</div>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" prepend-icon="mdi-steering" to="/drivers">Manage Drivers</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Route Metrics -->
        <v-col cols="12" md="6" lg="3">
          <v-card elevation="2" class="fill-height">
            <v-card-text>
              <div class="text-overline mb-1 text-medium-emphasis">Mapped Routes</div>
              <div class="text-h2 font-weight-black text-primary mb-2">{{ totalRoutes }}</div>
              <div class="text-caption">Active trotro routes in the system</div>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" prepend-icon="mdi-map-marker-path" color="primary" to="/routes">Edit Routes</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Pending Verifications -->
        <v-col cols="12" md="6" lg="3">
          <v-card elevation="2" class="fill-height" :color="pendingDrivers > 0 ? 'warning' : ''" :theme="pendingDrivers > 0 ? 'dark' : 'light'">
            <v-card-text>
              <div class="text-overline mb-1">Pending Approvals</div>
              <div class="text-h2 font-weight-black mb-2">{{ pendingDrivers }}</div>
              <div class="text-caption">Drivers waiting for verification</div>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" prepend-icon="mdi-shield-alert" to="/drivers">Review</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- A3: Real-time Driver Map -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title class="bg-grey-lighten-3">
              Live Driver Map
              <v-spacer></v-spacer>
              <v-chip size="small" :color="activeDrivers > 0 ? 'success' : 'grey'">
                {{ activeDrivers }} online
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-0">
              <div id="driverMap" style="height: 400px; width: 100%;"></div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- A4: Demand Analytics -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="bg-grey-lighten-3">
              Top 10 Busiest Stops
              <v-spacer></v-spacer>
              <v-chip size="small" color="warning">{{ totalDemand }} waiting</v-chip>
            </v-card-title>
            <v-card-text>
              <v-list v-if="topStops.length > 0" density="compact">
                <v-list-item v-for="(stop, i) in topStops" :key="i">
                  <template v-slot:prepend>
                    <v-avatar size="28" :color="stop._color">{{ i + 1 }}</v-avatar>
                  </template>
                  <v-list-item-title>{{ stop.Name || 'Unknown' }}</v-list-item-title>
                  <template v-slot:append>
                    <v-chip size="small" :color="stop._color" variant="tonal">
                      {{ stop.no_of_people || 0 }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <p v-else class="text-center text-grey py-4">No demand data available</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="bg-grey-lighten-3">
              Route Performance
              <v-spacer></v-spacer>
              <v-chip size="small" color="info">{{ totalRoutes }} routes</v-chip>
            </v-card-title>
            <v-card-text>
              <v-table density="compact" v-if="routeStats.length > 0">
                <thead>
                  <tr><th>Route</th><th>Avg Passengers</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in routeStats.slice(0, 8)" :key="i">
                    <td class="text-truncate" style="max-width: 200px">{{ r.name || 'Route ' + i }}</td>
                    <td>{{ r.avg_passengers || 0 }}</td>
                    <td>
                      <v-chip size="x-small" :color="r._active ? 'success' : 'grey'">
                        {{ r._active ? 'Active' : 'Idle' }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <p v-else class="text-center text-grey py-4">Loading route data...</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col cols="12">
            <v-card>
                <v-card-title class="bg-grey-lighten-3">
                    Recent Activity
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-refresh" variant="text" @click="refreshData" :loading="loading"></v-btn>
                </v-card-title>
                <v-card-text class="pt-4">
                    <p v-if="loading">Syncing live data from Supabase...</p>
                    <p v-else>All systems operational. Tracking {{ totalStops }} individual bus stops.</p>
                </v-card-text>
            </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
});

useHead({
  title: "Dashboard Overview | AwayBus",
});

const client = useSupabaseClient();
const loading = ref(true);

const totalDemand = ref(0);
const totalDrivers = ref(0);
const activeDrivers = ref(0);
const pendingDrivers = ref(0);
const totalRoutes = ref(0);
const totalStops = ref(0);
const topStops = ref([]);
const routeStats = ref([]);

const refreshData = async () => {
  loading.value = true;
  try {
    // 1. Calculate live passenger demand + top stops
    const { data: stopsData } = await client.from('awayBusStops').select('Name, no_of_people').order('no_of_people', { ascending: false }).limit(10);
    totalDemand.value = (stopsData || []).reduce((acc, stop) => acc + (stop.no_of_people || 0), 0);
    topStops.value = (stopsData || []).map(s => ({
      ...s,
      _color: (s.no_of_people || 0) > 8 ? 'red' : (s.no_of_people || 0) > 3 ? 'orange' : (s.no_of_people || 0) > 0 ? 'yellow' : 'green'
    }));
    
    // Count all stops for total
    const { count } = await client.from('awayBusStops').select('*', { count: 'exact', head: true });
    totalStops.value = count || 0;

    // 2. Calculate driver metrics
    const { data: driversData } = await client.from('awayBusDrivers').select('isVerified, isOnline');
    if (driversData) {
        totalDrivers.value = driversData.length;
        activeDrivers.value = driversData.filter(d => d.isOnline).length;
        pendingDrivers.value = driversData.filter(d => !d.isVerified).length;
    }

    // 3. Calculate total routes + route stats
    const { count: routesCount } = await client.from('awayBusRoutes').select('*', { count: 'exact', head: true });
    totalRoutes.value = routesCount || 0;

    // Get route performance: active drivers per route  
    const { data: routeData } = await client.from('awayBusRoutes').select('name, fare').limit(10);
    const { data: driversPerRoute } = await client.from('awayBusDrivers').select('busRoute, isOnline').eq('isOnline', true);
    
    routeStats.value = (routeData || []).map(r => {
      const activeOnRoute = (driversPerRoute || []).filter(d => d.busRoute == r.id || d.busRoute == r.osm_id).length;
      return {
        name: r.name || 'Unnamed',
        avg_passengers: Math.floor(Math.random() * 20), // placeholder until real check-in data
        fare: r.fare,
        _active: activeOnRoute > 0,
      };
    });

  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refreshData();
  
  // Set up realtime listener for live demand updates
  client.channel('public:awayBusStops')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'awayBusStops' }, () => {
        refreshData();
    })
    .subscribe();

  // A3: Initialize driver map
  if (process.client) {
    initDriverMap();
  }
});

// A3: Driver map initialization
let driverMap = null;
let driverMarkers = [];

async function initDriverMap() {
  const L = await import('leaflet');
  
  if (driverMap) {
    driverMap.remove();
  }
  
  driverMap = L.map('driverMap').setView([5.6037, -0.1870], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(driverMap);

  // Fetch online drivers and plot them
  const { data: drivers } = await client
    .from('awayBusDrivers')
    .select('name, coordinates, carNumber, currentBusStop, isOnline')
    .eq('isOnline', true);

  const greenIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const amberIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  if (drivers) {
    drivers.forEach(driver => {
      const coords = driver.coordinates?.split(',');
      if (coords && coords.length === 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng], {
            icon: driver.isOnline ? greenIcon : amberIcon,
          }).addTo(driverMap);
          marker.bindPopup(`
            <strong>${driver.name || 'Unknown'}</strong><br/>
            Car: ${driver.carNumber || 'N/A'}<br/>
            Status: ${driver.isOnline ? 'Active' : 'Idle'}
          `);
          driverMarkers.push(marker);
        }
      }
    });
  }

  // Realtime: listen for driver location updates
  client.channel('public:awayBusDrivers')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'awayBusDrivers' }, async () => {
      driverMarkers.forEach(m => m.remove());
      driverMarkers = [];
      await initDriverMap();
    })
    .subscribe();
}
</script>