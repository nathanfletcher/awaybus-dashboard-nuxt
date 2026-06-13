<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Riders Management</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Manage registered riders and their route assignments.</p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Riders</span>
              <v-spacer></v-spacer>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Rider</v-btn>
            </v-card-title>
            <v-card-text>
              <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search riders..." variant="outlined" density="compact" hide-details class="mb-4" style="max-width: 300px;"></v-text-field>
              <v-data-table :headers="headers" :items="riderList" :search="search" :loading="pending" density="comfortable">
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
            <v-text-field v-model="form.Name" label="Name" variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-text-field v-model="form.phone" label="Phone" variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-text-field v-model="form.busRoute" label="Bus Route (OSM ID)" variant="outlined" density="compact" class="mb-2"></v-text-field>
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
          <v-card-text class="pt-4">Remove {{ deletingRider?.Name || 'this rider' }}?</v-card-text>
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
import { ref } from 'vue'
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

const form = ref({ Name: '', phone: '', busRoute: '' })

const headers = [
  { title: 'Name', key: 'Name', sortable: true },
  { title: 'Phone', key: 'phone' },
  { title: 'Route', key: 'busRoute' },
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

function openAddDialog() {
  editingRider.value = null
  form.value = { Name: '', phone: '', busRoute: '' }
  showDialog.value = true
}

function openEditDialog(item) {
  editingRider.value = item
  form.value = { Name: item.Name, phone: item.phone, busRoute: item.busRoute }
  showDialog.value = true
}

async function saveRider() {
  saving.value = true
  try {
    const payload = { Name: form.value.Name, phone: form.value.phone, busRoute: form.value.busRoute }
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
