<template>
    <Transition name="scale-y">
      
          <v-alert v-if="successMsg" type="success" >
                {{ successMsg }}
            </v-alert>
          
    </Transition>
  </template>
  
  <script setup >
  defineProps({ successMsg: String })
  const emit = defineEmits(['clearSuccess'])
  const clearSuccess = () => {
    emit('clearSuccess');
  };
  </script>