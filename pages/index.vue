<template>
    <div>
      <NuxtWelcome />
    </div>
</template>
<script setup>
  definePageMeta({
      middleware: 'auth',
  });
  useHead({
      title: "Login | supaAuth",
  });
</script>