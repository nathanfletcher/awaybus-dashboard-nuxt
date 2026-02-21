<template>
    <div>
        <ClientOnly>
            <DataTableJs
            :supabase-table-name=table
            >
            </DataTableJs>
            <template #fallback>
                <div class="d-flex justify-center align-center" style="height: 200px;">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
            </template>
        </ClientOnly>
    </div>
</template>

<script setup>
    definePageMeta({
        middleware: 'auth',
    });
    const table = 'awayBusDrivers'
</script>