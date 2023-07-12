<template>
    <Transition name="scale-y">
      <v-alert v-if="errorMsg" type="error" >
        {{ errorMsg }}
      </v-alert>
    </Transition>
</template>

<script setup lang="ts">
defineProps<{ errorMsg: String }>()
const emit = defineEmits(['clearError'])
const clearError = () => {
  emit('clearError');
};
</script>
