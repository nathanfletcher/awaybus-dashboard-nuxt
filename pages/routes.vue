<template>
    <div>
        <h1>Getting all Bus Routes</h1>
        <DataTableJs
        :supabase-table=table
        >

        </DataTableJs>
    </div>
</template>

<script setup>
    const table = 'awayBusRoutes'
</script>