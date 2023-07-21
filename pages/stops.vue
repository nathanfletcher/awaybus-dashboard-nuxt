<template>
    <div>
        <h1>Getting all Bus Stops</h1>
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
    const table = 'awayBusStops'
</script>