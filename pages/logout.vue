<template>

</template>
<script setup>
// logout supabase user
const client = useSupabaseAuthClient();
await client.auth.signOut();

// redirect to login page
navigateTo('/login');
</script>