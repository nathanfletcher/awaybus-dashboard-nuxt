<template>
  <v-card>
    <v-layout>
      <!-- <v-system-bar color="deep-purple darken-3"></v-system-bar> -->

      <v-app-bar
        color="primary"
        prominent
      >
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

        <v-toolbar-title @click="navigateTo('/')">My files</v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn variant="text" icon="mdi-magnify"></v-btn>

        <v-btn variant="text" icon="mdi-filter"></v-btn>

        <v-btn variant="text" icon="mdi-dots-vertical"></v-btn>
      </v-app-bar>

      <v-navigation-drawer
        v-model="drawer"
        location="left"
        temporary
      >
        <NavigationList/>

      </v-navigation-drawer>

      <v-main >
        <slot/>
      </v-main>
    </v-layout>
  </v-card>
</template>
<script>
  export default {
    data: () => ({
      drawer: false,
      group: null,
      
    }),

    watch: {
      group () {
        this.drawer = false
      },
    },
  }
</script>