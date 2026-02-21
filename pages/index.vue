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

const refreshData = async () => {
  loading.value = true;
  try {
    // 1. Calculate live passenger demand
    const { data: stopsData } = await client.from('awayBusStops').select('no_of_people');
    totalDemand.value = (stopsData || []).reduce((acc, stop) => acc + (stop.no_of_people || 0), 0);
    totalStops.value = stopsData?.length || 0;

    // 2. Calculate driver metrics
    const { data: driversData } = await client.from('awayBusDrivers').select('isVerified, isOnline');
    if (driversData) {
        totalDrivers.value = driversData.length;
        activeDrivers.value = driversData.filter(d => d.isOnline).length;
        pendingDrivers.value = driversData.filter(d => !d.isVerified).length;
    }

    // 3. Calculate total routes
    const { count: routesCount } = await client.from('awayBusRoutes').select('*', { count: 'exact', head: true });
    totalRoutes.value = routesCount || 0;

  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refreshData();
  
  // Set up realtime listener for live demand updates!
  client.channel('public:awayBusStops')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'awayBusStops' }, () => {
        refreshData();
    })
    .subscribe();
});
</script>