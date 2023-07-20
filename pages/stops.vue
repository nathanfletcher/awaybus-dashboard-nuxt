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
    const table = 'awayBusStops'
</script>