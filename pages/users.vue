<template>
    <div>
        
            <NativeDataTable
            :supabase-table-name=table
            >
            </NativeDataTable>
        
    </div>
</template>

<script setup>
    definePageMeta({
        middleware: 'auth',
    });
    const table = 'awayBusRiders'
</script>