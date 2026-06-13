<template>
    <div>
        
            <NativeDataTable
            :supabase-table-name=table
            :realtime="true"
            >
            </NativeDataTable>
        
    </div>
</template>

<script setup>
    definePageMeta({
        middleware: 'auth',
    });
    const table = 'awayBusDrivers'
</script>