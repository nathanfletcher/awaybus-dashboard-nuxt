<template>
  <v-select
    v-model="selectedCity"
    :items="cityOptions"
    label="City"
    variant="outlined"
    density="compact"
    hide-details
    style="max-width: 180px;"
    @update:model-value="onCityChange"
  ></v-select>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const client = useSupabaseClient();
const selectedCity = ref(null);
const cityOptions = ref([]);

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
}
</script>
