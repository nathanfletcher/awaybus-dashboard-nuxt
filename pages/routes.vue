<template>
    <div>
        <h1>Getting all Bus Routes</h1>
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
    const table = 'awayBusRoutes'
</script>