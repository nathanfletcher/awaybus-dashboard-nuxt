<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Riders Management</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Manage registered riders and their route/stop assignments. <em>Anonymous app users appear in passenger check-ins, not here.</em></p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Registered Riders</span>
              <v-spacer></v-spacer>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Rider</v-btn>
            </v-card-title>
            <v-card-text>
              <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search riders..." variant="outlined" density="compact" hide-details class="mb-4" style="max-width: 300px;"></v-text-field>
              <v-data-table :headers="headers" :items="riderList" :search="search" :loading="pending" density="comfortable">
                <template v-slot:item.isActive="{ item }">
                  <v-chip :color="item.columns?.isActive ? 'success' : 'grey'" size="small" variant="tonal">
                    {{ item.columns?.isActive ? 'Active' : 'Inactive' }}
                  </v-chip>
                </template>
                <template v-slot:item.isMoving="{ item }">
                  <v-chip :color="item.columns?.isMoving ? 'info' : 'grey'" size="small" variant="tonal">
                    {{ item.columns?.isMoving ? 'Moving' : 'Idle' }}
                  </v-chip>
                </template>
                <template v-slot:item.created_at="{ item }">
                  {{ item.columns?.created_at ? new Date(item.columns.created_at).toLocaleDateString() : '—' }}
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item.raw)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item.raw)"></v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="showDialog" max-width="500">
        <v-card>
          <v-toolbar color="primary" :title="editingRider ? 'Edit Rider' : 'Add Rider'"></v-toolbar>
          <v-card-text class="pt-4">
            <v-select v-model="form.busStop" :items="stopOptions" label="Assigned Stop" variant="outlined" density="compact" class="mb-2" clearable></v-select>
            <v-select v-model="form.busRoute" :items="routeOptions" label="Assigned Route" variant="outlined" density="compact" class="mb-2" clearable></v-select>
            <v-text-field v-model="form.userID" label="User ID" variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-switch v-model="form.isActive" label="Active" color="success" density="compact" hide-details class="mb-2"></v-switch>
          </v-card-text>
          <v-card-actions class="justify-end pa-4">
            <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="elevated" @click="saveRider" :loading="saving">{{ editingRider ? 'Update' : 'Create' }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showDeleteConfirm" max-width="400">
        <v-card>
          <v-toolbar color="error" title="Remove Rider"></v-toolbar>
          <v-card-text class="pt-4">Remove rider #{{ deletingRider?.id }}?</v-card-text>
          <v-card-actions class="justify-end pa-4">
            <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
            <v-btn color="error" variant="elevated" @click="deleteRider">Remove</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { VDataTable } from 'vuetify/labs/VDataTable'

definePageMeta({ middleware: 'auth', layout: 'default' })
useHead({ title: 'Riders | AwayBus' })

const client = useSupabaseClient()
const saving = ref(false)
const search = ref('')
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingRider = ref(null)
const deletingRider = ref(null)

const form = ref({ busStop: null, busRoute: null, userID: null, isActive: false })
const stopOptions = ref([])
const routeOptions = ref([])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Stop', key: 'busStop' },
  { title: 'Route', key: 'busRoute' },
  { title: 'User ID', key: 'userID' },
  { title: 'Active', key: 'isActive' },
  { title: 'Moving', key: 'isMoving' },
  { title: 'Created', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const { data: riderList, pending, refresh: refreshRiders } = await useAsyncData(
  'rider-list',
  async () => {
    const { data } = await client.from('awayBusRiders').select('*').order('id')
    return data || []
  },
  { default: () => [] }
)

onMounted(async () => {
  const { data: stops } = await client.from('awayBusStops').select('osm_id, Name').limit(500).order('Name')
  if (stops) stopOptions.value = stops.map(s => ({ title: s.Name || s.osm_id, value: s.osm_id }))

  const { data: routes } = await client.from('awayBusRoutes').select('osm_id, name').limit(500).order('name')
  if (routes) routeOptions.value = routes.map(r => ({ title: r.name || r.osm_id, value: r.osm_id }))
})

function openAddDialog() {
  editingRider.value = null
  form.value = { busStop: null, busRoute: null, userID: null, isActive: false }
  showDialog.value = true
}

function openEditDialog(item) {
  editingRider.value = item
  form.value = {
    busStop: item.busStop || null,
    busRoute: item.busRoute || null,
    userID: item.userID || null,
    isActive: item.isActive || false,
  }
  showDialog.value = true
}

async function saveRider() {
  saving.value = true
  try {
    const payload = {
      busStop: form.value.busStop || null,
      busRoute: form.value.busRoute || null,
      userID: form.value.userID || null,
      isActive: form.value.isActive,
    }
    if (editingRider.value) {
      const oldValues = { ...editingRider.value }
      const { data: updated } = await client.from('awayBusRiders').update(payload).eq('id', editingRider.value.id).select()
      if (updated?.[0]) await auditLog('UPDATE', oldValues, updated[0], 'awayBusRiders', editingRider.value.id)
    } else {
      const { data: inserted } = await client.from('awayBusRiders').insert(payload).select()
      if (inserted?.[0]) await auditLog('INSERT', null, inserted[0], 'awayBusRiders', inserted[0].id)
    }
    showDialog.value = false
    await refreshRiders()
  } catch (e) { /* silent */ }
  saving.value = false
}

function confirmDelete(item) {
  deletingRider.value = item
  showDeleteConfirm.value = true
}

async function deleteRider() {
  const deletedRow = { ...deletingRider.value }
  await client.from('awayBusRiders').delete().eq('id', deletingRider.value.id)
  await auditLog('DELETE', deletedRow, null, 'awayBusRiders', deletingRider.value.id)
  showDeleteConfirm.value = false
  await refreshRiders()
}
</script>
