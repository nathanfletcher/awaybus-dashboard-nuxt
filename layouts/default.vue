<template>
  <v-app>
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

    <v-app-bar elevation="1" app color="surface">
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title class="font-weight-medium">Station Master</v-app-bar-title>
      <VitePwaManifest />
      <v-spacer></v-spacer>
      <v-select
        v-model="selectedCity"
        :items="cityOptions"
        label="City"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 180px; margin-right: 8px;"
        @update:model-value="onCityChange"
      ></v-select>
      <GlobalSearch />
      <v-btn icon="mdi-bell-outline" variant="text"></v-btn>
      <v-btn icon="mdi-account-circle" variant="text"></v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <slot/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const drawer = ref(true);
const selectedCity = ref(null);
const cityOptions = ref([]);

const client = useSupabaseClient();

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