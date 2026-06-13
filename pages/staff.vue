<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Staff Management</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Manage station staff accounts and roles.</p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>Staff Members</span>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Staff</v-btn>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="staff"
                :loading="loading"
                :search="search"
              >
                <template v-slot:top>
                  <v-text-field
                    v-model="search"
                    label="Search staff"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    class="ma-2"
                    hide-details
                  ></v-text-field>
                </template>

                <template v-slot:item.role="{ item }">
                  <v-chip
                    :color="roleColor(item.role)"
                    size="small"
                    :text="item.role"
                  ></v-chip>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEditDialog(item)"></v-btn>
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Add/Edit Dialog -->
      <v-dialog v-model="showDialog" max-width="500">
        <v-card>
          <v-toolbar :color="editing ? 'secondary' : 'primary'" :title="editing ? 'Edit Staff' : 'Add Staff'"></v-toolbar>
          <v-card-text class="mt-4">
            <v-text-field
              v-model="form.name"
              label="Name"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Name is required']"
            ></v-text-field>
            <v-text-field
              v-model="form.email"
              label="Email"
              type="email"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Email is required']"
            ></v-text-field>
            <v-text-field
              v-model="form.phone"
              label="Phone"
              variant="outlined"
              density="compact"
            ></v-text-field>
            <v-select
              v-model="form.role"
              label="Role"
              :items="roles"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Role is required']"
            ></v-select>
            <v-text-field
              v-model="form.station"
              label="Station"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="saveStaff" :loading="saving">
              {{ editing ? 'Update' : 'Create' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation -->
      <v-dialog v-model="showDeleteDialog" max-width="400">
        <v-card>
          <v-card-title>Confirm Delete</v-card-title>
          <v-card-text>
            Are you sure you want to remove <strong>{{ deleteTarget?.name }}</strong>?
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="deleteStaff" :loading="deleting">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

definePageMeta({ middleware: 'auth', layout: 'default' })

const client = useSupabaseClient()
const user = useSupabaseUser()

const search = ref('')
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editing = ref(false)
const staff = ref([])
const deleteTarget = ref(null)

const roles = ['admin', 'staff', 'viewer']

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Phone', key: 'phone' },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Station', key: 'station' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  role: 'staff',
  station: '',
}

const form = ref({ ...defaultForm })

function roleColor(role) {
  const colors = { admin: 'error', staff: 'primary', viewer: 'default' }
  return colors[role] || 'default'
}

async function loadStaff() {
  loading.value = true
  try {
    const { data } = await client.from('awayBusStaff').select('*').order('name')
    staff.value = data || []
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  editing.value = false
  form.value = { ...defaultForm }
  showDialog.value = true
}

function openEditDialog(item) {
  editing.value = true
  form.value = { ...item }
  showDialog.value = true
}

async function saveStaff() {
  saving.value = true
  try {
    if (editing.value) {
      await client.from('awayBusStaff').update(form.value).eq('id', form.value.id)
    } else {
      await client.from('awayBusStaff').insert(form.value)
    }
    showDialog.value = false
    await loadStaff()
  } finally {
    saving.value = false
  }
}

function confirmDelete(item) {
  deleteTarget.value = item
  showDeleteDialog.value = true
}

async function deleteStaff() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await client.from('awayBusStaff').delete().eq('id', deleteTarget.value.id)
    showDeleteDialog.value = false
    await loadStaff()
  } finally {
    deleting.value = false
  }
}

onMounted(loadStaff)
</script>
