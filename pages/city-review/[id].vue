<template>
  <div>
    <v-container>
      <v-row class="mb-4">
        <v-col cols="12">
          <v-breadcrumbs :items="[{ title: 'Cities', to: '/cities' }, { title: cityName || 'Review', disabled: true }]"></v-breadcrumbs>
          <h1 class="text-h3 font-weight-bold mb-2">Import Review: {{ cityName }}</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Pending Imports</v-card-title>
            <v-card-text>
              <v-data-table :headers="headers" :items="imports" :loading="loading">
                <template v-slot:item.import_status="{ item }">
                  <v-chip :color="statusColor(item.columns?.import_status)" size="small">{{ item.columns?.import_status }}</v-chip>
                </template>
                <template v-slot:item.created_at="{ item }">
                  {{ item.columns?.created_at ? new Date(item.columns.created_at).toLocaleString() : '—' }}
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn v-if="item.raw?.import_status === 'pending_review'" color="success" size="small" variant="tonal" @click="approve(item.raw)" :loading="approving === item.raw?.id">
                    Approve
                  </v-btn>
                  <v-btn v-if="item.raw?.import_status === 'pending_review'" color="error" size="small" variant="tonal" class="ml-2" @click="reject(item.raw)">
                    Reject
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Summary</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item title="City" :subtitle="cityName"></v-list-item>
                <v-list-item title="Total Imports" :subtitle="imports.length.toString()"></v-list-item>
                <v-list-item title="Pending Review" :subtitle="imports.filter(i => i.import_status === 'pending_review').length.toString()"></v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VDataTable } from 'vuetify/labs/VDataTable'

definePageMeta({ middleware: 'auth', layout: 'default' })

const route = useRoute()
const client = useSupabaseClient()
const loading = ref(false)
const approving = ref(null)
const imports = ref([])
const cityName = ref('')

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Status', key: 'import_status' },
  { title: 'Stops', key: 'stops_imported' },
  { title: 'Routes', key: 'routes_imported' },
  { title: 'Date', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false },
]

function statusColor(status) {
  return { pending_review: 'warning', published: 'success', rejected: 'error' }[status] || 'grey'
}

async function loadData() {
  loading.value = true
  const cityId = route.params.id
  
  const { data: city } = await client.from('cities').select('name').eq('id', cityId).single()
  if (city) cityName.value = city.name

  const { data } = await client.from('osm_imports')
    .select('*')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (data) imports.value = data
  loading.value = false
}

async function approve(item) {
  approving.value = item.id
  try {
    await client.from('osm_imports').update({ import_status: 'published', updated_at: new Date().toISOString() }).eq('id', item.id)
    await client.from('cities').update({ is_active: true }).eq('id', item.city_id)
    await loadData()
  } finally {
    approving.value = null
  }
}

async function reject(item) {
  await client.from('osm_imports').update({ import_status: 'rejected', updated_at: new Date().toISOString() }).eq('id', item.id)
  await loadData()
}

onMounted(loadData)
</script>
