<template>
  <v-app>
    <template v-if="!isAuthPage">
    <v-navigation-drawer
      v-model="drawer"
      color="primary"
      theme="dark"
      app
    >
      <div class="d-flex align-center pa-4 mb-4">
        <v-icon icon="mdi-bus" size="32" class="mr-3"></v-icon>
        <div class="text-h6 font-weight-bold">AwayBus</div>
      </div>
      <v-divider></v-divider>
      <NavigationList/>
    </v-navigation-drawer>

    </template>

    <v-app-bar v-if="!isAuthPage" elevation="1" app color="surface">
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title class="font-weight-medium">Station Master</v-app-bar-title>
      <VitePwaManifest />
      <v-spacer></v-spacer>
      <CitySelector />
      <GlobalSearch />
      <v-btn icon="mdi-refresh" variant="text" @click="refreshDashboard"></v-btn>
      <v-btn icon="mdi-logout" variant="text" @click="handleLogout" title="Logout"></v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <slot/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const route = useRoute();
const isAuthPage = computed(() => {
  return ['/login', '/forgot-password', '/new-password'].includes(route.path);
});

const drawer = ref(true);
const selectedCity = ref(null);
const cityOptions = ref([]);

const client = useSupabaseClient();

const supabaseClient = useSupabaseClient();
const router = useRouter();

function refreshDashboard() {
  window.location.reload();
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  router.push('/login');
}

onMounted(async () => {
  const { data } = await client.from('cities').select('id, name').eq('is_active', true).order('name');
  if (data) {
    cityOptions.value = data.map(c => ({ title: c.name, value: c.id }));
    const stored = localStorage.getItem('selectedCityId');
    if (stored) selectedCity.value = parseInt(stored);
  }
});

function onCityChange(cityId) {
  localStorage.setItem('selectedCityId', cityId?.toString() || '');
  // Could refresh data or apply city filter globally
}
</script>