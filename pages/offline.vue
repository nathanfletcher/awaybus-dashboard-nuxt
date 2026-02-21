<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card max-width="400" class="text-center pa-6" elevation="4">
      <v-icon icon="mdi-wifi-off" size="64" color="warning" class="mb-4"></v-icon>
      <h1 class="text-h5 font-weight-bold mb-2">You are offline</h1>
      <p class="text-body-1 text-medium-emphasis mb-6">
        It looks like you've lost your connection. The dashboard has cached the master routes and stops so you can still view them while offline.
      </p>
      <v-btn color="primary" block to="/" prepend-icon="mdi-home">
        Return to Dashboard
      </v-btn>
    </v-card>
  </v-container>
</template>
<script setup>
definePageMeta({
  layout: 'default'
})
</script>