<template>
  <v-list nav>
    <v-list-item
      v-for="item in items"
      :key="item.title"
      :to="item.value"
      :prepend-icon="item.icon"
      :title="item.title"
      link
      exact
    ></v-list-item>
  </v-list>
</template>

<script setup>
import { ref } from 'vue';

const items = ref([
  { title: 'Dashboard', value: '/', icon: 'mdi-view-dashboard' },
  { title: 'Bus Stops', value: '/stops', icon: 'mdi-bus-stop' },
  { title: 'Bus Routes', value: '/routes', icon: 'mdi-map-marker-path' },
  { title: 'Drivers', value: '/drivers', icon: 'mdi-steering' },
  { title: 'Users', value: '/users', icon: 'mdi-account-group' },
  { title: 'Logout', value: '/logout', icon: 'mdi-logout' }
]);
</script>