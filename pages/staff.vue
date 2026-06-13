<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Staff Management</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Manage AwayBus staff accounts and roles.</p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Staff Members</span>
              <v-spacer></v-spacer>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Staff</v-btn>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="staffList"
                :loading="loading"
                density="comfortable"
              >
                <template v-slot:item.role="{ item }">
                  <v-chip :color="roleColor(item.columns?.role)" size="small" variant="tonal">
                    {{ item.columns?.role || '—' }}
                  </v-chip>
                </template>
                <template v-slot:item.last_seen="{ item }">
                  {{ item.columns?.last_seen ? new Date(item.columns.last_seen).toLocaleDateString() : '—' }}
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item.raw)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item.raw)" :disabled="item.raw?.email === 'admin@awaybus.com'"></v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="showDialog" max-width="500">
        <v-card>
          <v-toolbar color="primary" :title="editingStaff ? 'Edit Staff' : 'Add Staff'"></v-toolbar>
          <v-card-text class="pt-4">
            <v-text-field v-model="form.first_name" label="First Name" variant="outlined" density="compact" class="mb-2" :rules="[v => !!v || 'Required']"></v-text-field>
            <v-text-field v-model="form.last_name" label="Last Name" variant="outlined" density="compact" class="mb-2" :rules="[v => !!v || 'Required']"></v-text-field>
            <v-text-field v-model="form.email" label="Email" variant="outlined" density="compact" class="mb-2" :rules="[v => !!v || 'Required']"></v-text-field>
            <v-text-field v-model="form.phone_number" label="Phone" variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-select v-model="form.role" :items="availableRoles" label="Role" variant="outlined" density="compact" class="mb-2">
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props" :subtitle="roleDescription(item.title)"></v-list-item>
              </template>
            </v-select>
            <v-alert v-if="formError" type="error" variant="tonal" class="mb-2">{{ formError }}</v-alert>
          </v-card-text>
          <v-card-actions class="justify-end pa-4">
            <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="elevated" @click="saveStaff" :loading="saving">{{ editingStaff ? 'Update' : 'Create' }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showDeleteConfirm" max-width="400">
        <v-card>
          <v-toolbar color="error" title="Remove Staff"></v-toolbar>
          <v-card-text class="pt-4">Remove {{ deletingStaff?.first_name }} {{ deletingStaff?.last_name }}?</v-card-text>
          <v-card-actions class="justify-end pa-4">
            <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
            <v-btn color="error" variant="elevated" @click="deleteStaff">Remove</v-btn>
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
useHead({ title: 'Staff Management | AwayBus' })

const client = useSupabaseClient()
const staffList = ref([])
const loading = ref(true)
const saving = ref(false)
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingStaff = ref(null)
const deletingStaff = ref(null)
const formError = ref('')
const availableRoles = ['superadmin', 'admin', 'staff', 'viewer']
const form = ref({ first_name: '', last_name: '', email: '', phone_number: '', role: 'staff' })

const headers = [
  { title: 'Name', key: 'first_name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Phone', key: 'phone_number' },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Last Seen', key: 'last_seen', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

async function loadStaff() {
  try {
    const { data } = await client.from('awayBusStaff').select('*').order('id')
    staffList.value = data || []
  } finally {
    loading.value = false
  }
}
onMounted(loadStaff)

function roleColor(role) {
  return { superadmin: 'deep-purple', admin: 'primary', staff: 'info', viewer: 'grey' }[role] || 'grey'
}
function roleDescription(role) {
  const d = { superadmin: 'Full access. Can manage staff and all system data.', admin: 'Can manage all business data. Cannot manage staff.', staff: 'Can CRUD stops, routes, drivers, riders.', viewer: 'Read-only access to dashboard.' }
  return d[role] || ''
}
function openAddDialog() { editingStaff.value = null; form.value = { first_name: '', last_name: '', email: '', phone_number: '', role: 'staff' }; formError.value = ''; showDialog.value = true }
function openEditDialog(item) { editingStaff.value = item; form.value = { ...item }; formError.value = ''; showDialog.value = true }
async function saveStaff() {
  saving.value = true; formError.value = ''
  try {
    const payload = { first_name: form.value.first_name, last_name: form.value.last_name, phone_number: form.value.phone_number, role: form.value.role }
    if (editingStaff.value) {
      const oldValues = { ...editingStaff.value }
      const { data: updated } = await client.from('awayBusStaff').update(payload).eq('id', editingStaff.value.id).select()
      if (updated?.[0]) await auditLog('UPDATE', oldValues, updated[0], 'awayBusStaff', editingStaff.value.id)
    } else {
      const { data: inserted } = await client.from('awayBusStaff').insert({ ...payload, email: form.value.email }).select()
      if (inserted?.[0]) await auditLog('INSERT', null, inserted[0], 'awayBusStaff', inserted[0].id)
    }
    showDialog.value = false; await loadStaff()
  } catch (e) { formError.value = e.message || 'Failed to save' }
  saving.value = false
}
function confirmDelete(item) { deletingStaff.value = item; showDeleteConfirm.value = true }
async function deleteStaff() {
  const deletedRow = { ...deletingStaff.value }
  await client.from('awayBusStaff').delete().eq('id', deletingStaff.value.id)
  await auditLog('DELETE', deletedRow, null, 'awayBusStaff', deletingStaff.value.id)
  showDeleteConfirm.value = false; await loadStaff()
}
</script>
