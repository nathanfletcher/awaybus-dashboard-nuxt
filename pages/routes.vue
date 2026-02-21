<template>
    <div>
        
            <NativeDataTable
            :supabase-table-name=table
            supabase-table-id="osm_id"
            >
            </NativeDataTable>
        
    </div>
</template>

<script setup>
    definePageMeta({
        middleware: 'auth',
    });
    const table = 'awayBusRoutes'
</script>