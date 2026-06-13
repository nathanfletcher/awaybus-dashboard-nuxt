<template>
  <div>
    <v-container>
      <v-row class="mb-6">
        <v-col cols="12">
          <h1 class="text-h3 font-weight-bold mb-2">Audit Log</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Track all administrative changes across the system.</p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="logs"
                :loading="loading"
                :search="search"
                :sort-by="[{ key: 'created_at', order: 'desc' }]"
              >
                <template v-slot:top>
                  <v-row class="ma-2" align="center">
                    <v-col cols="4">
                      <v-text-field
                        v-model="search"
                        label="Search audit log"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-text-field>
                    </v-col>
                    <v-col cols="3">
                      <v-select
                        v-model="filterTable"
                        label="Filter by table"
                        :items="tableNames"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                      ></v-select>
                    </v-col>
                    <v-col cols="3">
                      <v-select
                        v-model="filterAction"
                        label="Filter by action"
                        :items="['INSERT', 'UPDATE', 'DELETE']"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                      ></v-select>
                    </v-col>
                  </v-row>
                </template>

                <template v-slot:item.action="{ item }">
                  <v-chip
                    :color="actionColor(item.action)"
                    size="small"
                    :text="item.action"
                  ></v-chip>
                </template>

                <template v-slot:item.created_at="{ item }">
                  {{ new Date(item.created_at).toLocaleString() }}
                </template>

                <template v-slot:item.old_values="{ item }">
                  <v-tooltip v-if="item.old_values">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" size="small">mdi-eye</v-icon>
                    </template>
                    <pre class="text-caption">{{ JSON.stringify(item.old_values, null, 2) }}</pre>
                  </v-tooltip>
                  <span v-else class="text-grey">—</span>
                </template>

                <template v-slot:item.new_values="{ item }">
                  <v-tooltip>
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" size="small">mdi-eye</v-icon>
                    </template>
                    <pre class="text-caption">{{ JSON.stringify(item.new_values, null, 2) }}</pre>
                  </v-tooltip>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({ middleware: 'auth', layout: 'default' })

const client = useSupabaseClient()
const search = ref('')
const filterTable = ref(null)
const filterAction = ref(null)
const loading = ref(false)
const logs = ref([])

const headers = [
  { title: 'Time', key: 'created_at', sortable: true },
  { title: 'Action', key: 'action', sortable: true },
  { title: 'Table', key: 'table_name', sortable: true },
  { title: 'Row ID', key: 'row_id' },
  { title: 'Old Values', key: 'old_values', sortable: false },
  { title: 'New Values', key: 'new_values', sortable: false },
]

const tableNames = computed(() => {
  const names = new Set(logs.value.map(l => l.table_name))
  return [...names].sort()
})

const filteredLogs = computed(() => {
  let result = logs.value
  if (filterTable.value) {
    result = result.filter(l => l.table_name === filterTable.value)
  }
  if (filterAction.value) {
    result = result.filter(l => l.action === filterAction.value)
  }
  return result
})

function actionColor(action) {
  const colors = { INSERT: 'success', UPDATE: 'primary', DELETE: 'error' }
  return colors[action] || 'default'
}

async function loadLogs() {
  loading.value = true
  try {
    const { data } = await client.from('audit_log').select('*').order('created_at', { ascending: false }).limit(500)
    logs.value = data || []
  } finally {
    loading.value = false
  }
}

onMounted(loadLogs)
</script>
