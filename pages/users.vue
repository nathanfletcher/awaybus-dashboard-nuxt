<template>
    <div>
        <h1>Getting all users</h1>
        <DataTableJs
        :supabase-table-name=table
        >

        </DataTableJs>
    </div>
</template>

<script setup>
    definePageMeta({
        middleware: 'auth',
    });
    const table = 'awayBusDrivers'
</script>