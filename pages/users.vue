<template>
    <div>
        <h1>Getting all users</h1>
        <DataTableJs
        :supabase-table=table
        >

        </DataTableJs>
    </div>
</template>

<script setup>
    const table = 'awayBusDrivers'
</script>