<template>
    <div>
        <ClientOnly>
            <NativeDataTable
            :supabase-table-name=table
            supabase-table-id="osm_id"
            >
            </NativeDataTable>
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
    const table = 'awayBusRoutes'
</script>