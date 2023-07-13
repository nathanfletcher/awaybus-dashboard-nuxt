<template>
    <div>
      
        <!-- <NuxtLink :to=item.value>
          <v-list
          :items="items"
        >
      </v-list>
        </NuxtLink> -->
        <v-list>
          <v-list-item v-for="item in items" :key="item.title">
              <NuxtLink :to=item.value>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </NuxtLink>
          </v-list-item>
        </v-list>


      
    </div>
</template>
<script>
  export default {
    data: () => ({
      items: [
        {
          title: 'Drivers',
          value: 'drivers',
        },
        {
          title: 'Users',
          value: 'users',
        },
      ],
    }),
  }
</script>