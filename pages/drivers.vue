<template>
    <div>
        <h1>Getting all drivers</h1>
        <DataTableJs
        :supabase-table=table
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