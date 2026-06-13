<template>
    <div>
        
            <NativeDataTable
            :supabase-table-name=table
            supabase-table-id="osm_id"
            :realtime="true"
            >
            </NativeDataTable>
        
    </div>
</template>

<script setup>
    definePageMeta({
        middleware: 'auth',
    });
    const table = 'awayBusStops'
</script>