<template>
    <v-card elevation="2" class="pa-4 rounded-lg">
        <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h5 font-weight-bold text-capitalize">{{ props.supabaseTableName.replace('awayBus', '') }} Management</h2>
            <div class="d-flex gap-2">
                <!-- Add Dialog -->
                <v-dialog :width="props.supabaseTableName === 'awayBusStops' ? 1000 : 500" v-model="showAddDialog">
                    <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props" prepend-icon="mdi-plus">Add</v-btn>
                    </template>
                    <v-card>
                        <v-toolbar color="primary" title="Add Record"></v-toolbar>
                        <v-card-text>
                            <v-row>
                                <v-col :cols="props.supabaseTableName === 'awayBusStops' ? 6 : 12">
                                    <div style="max-height: 500px; overflow-y: auto; padding-right: 12px;">
                                        <div v-for="jsonKey in Object.keys(tableObjectTemplate)" :key="jsonKey">
                                            <v-text-field v-if="jsonKey===props.supabaseTableId"
                                                v-model="tableObjectTemplate[jsonKey]"
                                                disabled
                                                :label="jsonKey"
                                                variant="outlined" density="compact" class="mb-2"
                                            ></v-text-field>
                                            <v-text-field v-else
                                                v-model="tableObjectTemplate[jsonKey]"
                                                :label="jsonKey"
                                                @input="updateBusStopMapFromInput"
                                                variant="outlined" density="compact" class="mb-2"
                                            ></v-text-field>
                                        </div> 
                                    </div>
                                </v-col>
                                <v-col cols="6" v-if="props.supabaseTableName === 'awayBusStops'">
                                    <h3>Stop Location</h3>
                                    <p class="text-caption">Click the map or drag the marker to set coordinates.</p>
                                    <div id="busStopAddMapNative" style="height: 400px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                </v-col>
                            </v-row>
                        </v-card-text>
                        <v-card-actions class="justify-end pa-4">
                            <v-btn variant="text" @click="closeAddDialog">Cancel</v-btn>
                            <v-btn color="primary" variant="elevated" @click="createSupabaseRow">Create</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>

                <!-- Edit Dialog -->
                <v-dialog :width="props.supabaseTableName === 'awayBusStops' ? 1000 : 500" v-model="showEditDialog">
                    <template v-slot:activator="{ props }">
                        <v-btn color="secondary" v-bind="props" :disabled="selectedRows.length !== 1" @click="openEditDialog" prepend-icon="mdi-pencil">Edit</v-btn>
                    </template>
                    <v-card>
                        <v-toolbar color="secondary" title="Edit Record"></v-toolbar>
                        <v-card-text>
                            <v-row>
                                <v-col :cols="props.supabaseTableName === 'awayBusStops' ? 6 : 12">
                                    <div style="max-height: 500px; overflow-y: auto; padding-right: 12px;">
                                        <template v-for="jsonKey in Object.keys(tableObject)" :key="jsonKey">
                                            <v-text-field v-if="jsonKey===props.supabaseTableId"
                                                v-model="tableObject[jsonKey]"
                                                disabled
                                                :label="jsonKey"
                                                variant="outlined" density="compact" class="mb-2"
                                            ></v-text-field>
                                            <v-text-field v-else
                                                v-model="tableObject[jsonKey]"
                                                :label="jsonKey"
                                                @input="updateBusStopMapFromInput"
                                                variant="outlined" density="compact" class="mb-2"
                                            ></v-text-field>
                                        </template> 
                                    </div>
                                </v-col>
                                <v-col cols="6" v-if="props.supabaseTableName === 'awayBusStops'">
                                    <h3>Stop Location</h3>
                                    <p class="text-caption">Click the map or drag the marker to update coordinates.</p>
                                    <div id="busStopEditMapNative" style="height: 400px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                </v-col>
                            </v-row>
                        </v-card-text>
                        <v-card-actions class="justify-end pa-4">
                            <v-btn variant="text" @click="closeEditDialog">Cancel</v-btn>
                            <v-btn color="secondary" variant="elevated" @click="editSupabaseRow">Save Changes</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>

                <!-- Delete Dialog -->
                <v-dialog width="500" v-model="showDeleteDialog">
                    <template v-slot:activator="{ props }">
                        <v-btn color="error" v-bind="props" :disabled="selectedRows.length === 0" prepend-icon="mdi-delete">Delete</v-btn>
                    </template>
                    <v-card>
                        <v-toolbar color="error" title="Confirm Deletion"></v-toolbar>
                        <v-card-text class="pt-4">
                            <div class="text-body-1">Are you sure you want to delete {{ selectedRows.length }} selected item(s)? This action cannot be undone.</div>
                        </v-card-text>
                        <v-card-actions class="justify-end pa-4">
                            <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
                            <v-btn color="error" variant="elevated" @click="deleteSupabaseRows">Delete</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>

                <!-- Route Builder Dialog -->
                <v-dialog width="1200" v-model="showRouteBuilder">
                    <v-card>
                        <v-toolbar color="primary" title="Interactive Route Builder"></v-toolbar>
                        <v-card-text class="pt-4">
                            <v-alert type="info" variant="tonal" class="mb-4">Select stops to add them to the route. Map will preview the path.</v-alert>
                            <v-row>
                                <v-col cols="4">
                                    <h3>Available Stops</h3>
                                    <v-text-field v-model="stopSearch" label="Search Stops" density="compact" variant="outlined" hide-details class="mb-2" prepend-inner-icon="mdi-magnify"></v-text-field>
                                    <v-list height="450" style="overflow-y: auto" border class="rounded">
                                        <v-list-item v-for="stop in filteredStops" :key="stop.osm_id" @click="addStopToRoute(stop)">
                                            <v-list-item-title>{{ stop.Name || 'Unnamed' }}</v-list-item-title>
                                            <v-list-item-subtitle>{{ stop.osm_id }}</v-list-item-subtitle>
                                            <template v-slot:append>
                                                <v-icon icon="mdi-plus-circle" color="success"></v-icon>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                </v-col>
                                <v-col cols="5">
                                    <h3>Route Map</h3>
                                    <div id="routeMapNative" style="height: 450px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                </v-col>
                                <v-col cols="3">
                                    <h3>Route Order</h3>
                                    <v-list height="450" style="overflow-y: auto" border class="rounded">
                                        <v-list-item v-for="(stopId, index) in currentRouteStops" :key="index">
                                            <v-list-item-title class="text-wrap">{{ getStopName(stopId) }}</v-list-item-title>
                                            <template v-slot:append>
                                                <div class="d-flex align-center">
                                                    <v-btn icon="mdi-arrow-up" variant="text" size="small" density="comfortable" @click="moveStop(index, -1)" :disabled="index === 0"></v-btn>
                                                    <v-btn icon="mdi-arrow-down" variant="text" size="small" density="comfortable" @click="moveStop(index, 1)" :disabled="index === currentRouteStops.length - 1"></v-btn>
                                                    <v-btn icon="mdi-delete" variant="text" size="small" density="comfortable" color="error" @click="removeStop(index)"></v-btn>
                                                </div>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                </v-col>
                            </v-row>
                        </v-card-text>
                        <v-card-actions class="pa-4">
                            <v-spacer></v-spacer>
                            <v-btn variant="text" @click="closeRouteBuilder">Cancel</v-btn>
                            <v-btn color="primary" variant="elevated" @click="saveRouteStops">Save Route</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </div>
        </div>

        <div class="d-flex align-center mb-4">
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Search Data"
                single-line
                hide-details
                variant="outlined"
                density="compact"
                style="max-width: 300px;"
            ></v-text-field>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" variant="text" @click="refreshData" :loading="pending"></v-btn>
        </div>

        <v-data-table
            v-model="selectedRows"
            :headers="computedHeaders"
            :items="data"
            :search="search"
            :loading="pending"
            :item-value="props.supabaseTableId"
            show-select
            return-object
            hover
            density="comfortable"
            class="border rounded"
            :items-per-page="50"
            :items-per-page-options="[10, 50, 100, 300, 500]"
        >
            <template v-slot:item.actions="{ item }">
                <v-btn v-if="props.supabaseTableName === 'awayBusDrivers' && !item.isVerified" 
                    color="success" size="small" variant="tonal" @click.stop="verifyDriver(item)">Verify</v-btn>
                <v-btn v-if="props.supabaseTableName === 'awayBusRoutes'" 
                    color="primary" size="small" variant="tonal" @click.stop="openRouteBuilder(item)">Edit Stops</v-btn>
            </template>
        </v-data-table>
    </v-card>
</template>

<script setup>
import { ref, computed, watch, toRaw, onMounted, shallowRef } from 'vue';
import { VDataTable } from 'vuetify/labs/VDataTable';

const props = defineProps({
    supabaseColumns: {
        type: String,
        required: false,
        default: '*'
    },
    supabaseTableName: {
        type: String,
        required: true,
    },
    supabaseTableId: {
        type: String,
        required: false,
        default: 'id'
    }
});

const client = useSupabaseClient();
const search = ref('');
const selectedRows = ref([]);
const tableObject = ref({});
const tableObjectTemplate = ref({});

const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showRouteBuilder = ref(false);

const data = shallowRef([]);
const pending = ref(true);

// Map instances
let busStopMapInstance = null;
let busStopMarker = null;
let routeMapInstance = null;
let routePolyline = null;
let routeMarkers = [];

// Route Builder State
const stopSearch = ref('');
const allStops = ref([]);
const currentRouteStops = ref([]);
const currentEditingRoute = ref(null);

// Fetch Data using Nuxt isomorphic fetching
const { data: asyncData, pending: asyncPending, error: fetchError, refresh: refreshNuxtData } = await useAsyncData(
    `fetch_${props.supabaseTableName}`,
    async () => {
        let allData = [];
        let from = 0;
        let step = 1000;
        while (true) {
            const { data: pageData, error } = await client
                .from(props.supabaseTableName)
                .select(props.supabaseColumns)
                .range(from, from + step - 1);
            if (error) {
                console.error("Error fetching data:", error);
                throw error;
            }
            if (!pageData || pageData.length === 0) break;
            
            allData.push(...pageData);
            if (pageData.length < step) break;
            from += step;
        }
        return allData;
    },
    { server: false }
);

watchEffect(() => {
    if (asyncData.value) {
        data.value = asyncData.value;
        if (data.value.length > 0 && Object.keys(tableObjectTemplate.value).length === 0) {
            let tmpl = clearObject(Object.assign({}, toRaw(data.value[0])));
            delete tmpl[props.supabaseTableId];
            delete tmpl["created_at"];
            tableObjectTemplate.value = tmpl;
        }
    }
    pending.value = asyncPending.value;
});

const refreshData = async () => {
    selectedRows.value = [];
    await refreshNuxtData();
};

// Headers
const computedHeaders = computed(() => {
    if (data.value && data.value.length > 0) {
        const keys = Object.keys(toRaw(data.value[0]));
        const headers = keys.map(key => ({
            title: key,
            key: key,
            align: 'start',
            sortable: true
        }));
        headers.push({ title: 'Actions', key: 'actions', align: 'end', sortable: false });
        return headers;
    }
    return [{ title: 'Actions', key: 'actions', align: 'end', sortable: false }];
});

// Helper Functions
function clearObject(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            obj[key] = '';
        }
    }
    return obj;
}

// Dialog Handlers
function openEditDialog() {
    if (selectedRows.value.length === 1) {
        let rowData = Object.assign({}, toRaw(selectedRows.value[0]));
        for (let key in rowData) {
            if (typeof rowData[key] === 'object' && rowData[key] !== null) {
                rowData[key] = JSON.stringify(rowData[key]);
            }
        }
        tableObject.value = rowData;
        showEditDialog.value = true;
        if (props.supabaseTableName === 'awayBusStops') {
            initBusStopMap('busStopEditMapNative', tableObject);
        }
    }
}

function closeAddDialog() {
    showAddDialog.value = false;
    if (busStopMapInstance) {
        busStopMapInstance.remove();
        busStopMapInstance = null;
    }
}

function closeEditDialog() {
    showEditDialog.value = false;
    if (busStopMapInstance) {
        busStopMapInstance.remove();
        busStopMapInstance = null;
    }
}

watch(showAddDialog, (val) => {
    if (val) {
        // Reset template to empty values from first row shape
        if (data.value && data.value.length > 0) {
            let tmpl = clearObject(Object.assign({}, toRaw(data.value[0])));
            delete tmpl[props.supabaseTableId];
            delete tmpl["created_at"];
            tableObjectTemplate.value = tmpl;
        }
        if (props.supabaseTableName === 'awayBusStops') {
            initBusStopMap('busStopAddMapNative', tableObjectTemplate);
        }
    } else if (!val && busStopMapInstance) {
        busStopMapInstance.remove();
        busStopMapInstance = null;
    }
});

// Map Logic for Add/Edit
function initBusStopMap(mapId, targetObject) {
    if (!process.client) return;
    setTimeout(() => {
        import('leaflet').then(L => {
            if (busStopMapInstance) {
                busStopMapInstance.remove();
                busStopMapInstance = null;
            }
            
            const mapEl = document.getElementById(mapId);
            if (!mapEl) return;
            
            let initialLat = 5.6037;
            let initialLon = -0.1870;
            let zoom = 12;

            if (targetObject.value && targetObject.value.coordinates) {
                const parts = String(targetObject.value.coordinates).split(',');
                if (parts.length === 2) {
                    initialLon = parseFloat(parts[0]);
                    initialLat = parseFloat(parts[1]);
                    zoom = 16;
                }
            }

            busStopMapInstance = L.map(mapId).setView([initialLat, initialLon], zoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(busStopMapInstance);

            if (targetObject.value && targetObject.value.coordinates) {
                busStopMarker = L.marker([initialLat, initialLon], { draggable: true }).addTo(busStopMapInstance);
            } else {
                busStopMarker = L.marker([initialLat, initialLon], { draggable: true });
            }

            busStopMapInstance.on('click', function(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                busStopMarker.setLatLng([lat, lng]);
                if (!busStopMapInstance.hasLayer(busStopMarker)) {
                    busStopMarker.addTo(busStopMapInstance);
                }
                targetObject.value.coordinates = `${lng},${lat}`;
            });

            busStopMarker.on('dragend', function(e) {
                const lat = busStopMarker.getLatLng().lat;
                const lng = busStopMarker.getLatLng().lng;
                targetObject.value.coordinates = `${lng},${lat}`;
            });
        });
    }, 300);
}

function updateBusStopMapFromInput() {
    if (!busStopMapInstance || !busStopMarker) return;
    const target = showAddDialog.value ? tableObjectTemplate : tableObject;
    if (target.value && target.value.coordinates) {
         const parts = String(target.value.coordinates).split(',');
         if (parts.length === 2) {
             const lat = parseFloat(parts[1]);
             const lon = parseFloat(parts[0]);
             if (!isNaN(lat) && !isNaN(lon)) {
                 busStopMarker.setLatLng([lat, lon]);
                 if (!busStopMapInstance.hasLayer(busStopMarker)) {
                    busStopMarker.addTo(busStopMapInstance);
                 }
                 busStopMapInstance.setView([lat, lon], 16);
             }
         }
    }
}

// CRUD Operations
async function createSupabaseRow() {
    let payload = Object.assign({}, toRaw(tableObjectTemplate.value));
    let finalPayload = {};
    for (let key in payload) {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) continue;
        if (typeof payload[key] === 'string' && (payload[key].startsWith('[') || payload[key].startsWith('{'))) {
            try { finalPayload[key] = JSON.parse(payload[key]); } catch(e) { finalPayload[key] = payload[key]; }
        } else {
            finalPayload[key] = payload[key];
        }
    }

    const { data: insertedData, error } = await client
        .from(props.supabaseTableName)
        .insert(finalPayload)
        .select();
        
    if (error) {
        console.error(error);
    } else if (insertedData && insertedData.length > 0) {
        data.value = [...data.value, insertedData[0]];
        closeAddDialog();
    }
}

async function editSupabaseRow() {
    let payload = Object.assign({}, toRaw(tableObject.value));
    let finalPayload = {};
    for (let key in payload) {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) continue;
        if (typeof payload[key] === 'string' && (payload[key].startsWith('[') || payload[key].startsWith('{'))) {
            try { finalPayload[key] = JSON.parse(payload[key]); } catch(e) { finalPayload[key] = payload[key]; }
        } else {
            finalPayload[key] = payload[key];
        }
    }

    const { data: updatedData, error } = await client
        .from(props.supabaseTableName)
        .upsert(finalPayload)
        .select();
        
    if (error) {
        console.error(error);
    } else if (updatedData && updatedData.length > 0) {
        const updatedId = updatedData[0][props.supabaseTableId];
        const idx = data.value.findIndex(item => item[props.supabaseTableId] === updatedId);
        if (idx !== -1) {
            const newData = [...data.value];
            newData[idx] = updatedData[0];
            data.value = newData;
            
            // Update selected rows so the UI stays consistent
            const selIdx = selectedRows.value.findIndex(item => item[props.supabaseTableId] === updatedId);
            if(selIdx !== -1) {
                selectedRows.value[selIdx] = updatedData[0];
            }
        }
        closeEditDialog();
    }
}

async function deleteSupabaseRows() {
    for (const row of selectedRows.value) {
        const deletedId = row[props.supabaseTableId];
        const { error } = await client
            .from(props.supabaseTableName)
            .delete()
            .eq(props.supabaseTableId, deletedId);
            
        if (error) {
            console.error(error);
        } else {
            const idx = data.value.findIndex(item => item[props.supabaseTableId] === deletedId);
            if (idx !== -1) {
                const newData = [...data.value];
                newData.splice(idx, 1);
                data.value = newData;
            }
        }
    }
    showDeleteDialog.value = false;
    selectedRows.value = [];
}

// Custom Actions
async function verifyDriver(driver) {
    const { data: updatedData, error } = await client
        .from('awayBusDrivers')
        .update({ isVerified: true })
        .eq('id', driver.id)
        .select();
    
    if (!error && updatedData && updatedData.length > 0) {
        const idx = data.value.findIndex(item => item.id === driver.id);
        if (idx !== -1) {
            const newData = [...data.value];
            newData[idx].isVerified = true;
            data.value = newData;
        }
    }
}

// Route Builder Logic
const filteredStops = computed(() => {
    if (!stopSearch.value) return allStops.value.slice(0, 100);
    return allStops.value.filter(s => 
        (s.Name && s.Name.toLowerCase().includes(stopSearch.value.toLowerCase())) || 
        (s.osm_id && s.osm_id.toString().includes(stopSearch.value))
    ).slice(0, 100);
});

async function fetchAllStops() {
    const { data: stops } = await client.from('awayBusStops').select('osm_id, Name, coordinates').limit(5000);
    allStops.value = stops || [];
}

function getStopName(id) {
    const stop = allStops.value.find(s => s.osm_id == id);
    return stop ? (stop.Name || 'Unnamed') : id;
}

function addStopToRoute(stop) {
    currentRouteStops.value.push(stop.osm_id);
    updateRouteMapNative();
}

function removeStop(index) {
    currentRouteStops.value.splice(index, 1);
    updateRouteMapNative();
}

function moveStop(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentRouteStops.value.length) return;
    const temp = currentRouteStops.value[index];
    currentRouteStops.value[index] = currentRouteStops.value[newIndex];
    currentRouteStops.value[newIndex] = temp;
    updateRouteMapNative();
}

async function openRouteBuilder(route) {
    if (allStops.value.length === 0) await fetchAllStops();
    currentEditingRoute.value = Object.assign({}, toRaw(route));
    try {
        const stops = typeof route.busStops === 'string' ? JSON.parse(route.busStops) : route.busStops;
        currentRouteStops.value = Array.isArray(stops) ? [...stops] : [];
    } catch (e) {
        currentRouteStops.value = [];
    }
    showRouteBuilder.value = true;
    setTimeout(initRouteMapNative, 300);
}

function closeRouteBuilder() {
    showRouteBuilder.value = false;
    if (routeMapInstance) {
        routeMapInstance.remove();
        routeMapInstance = null;
        routePolyline = null;
        routeMarkers = [];
    }
}

async function saveRouteStops() {
    const { data: updatedData, error } = await client
        .from('awayBusRoutes')
        .update({ busStops: currentRouteStops.value })
        .eq('osm_id', currentEditingRoute.value.osm_id)
        .select();
    
    if (!error && updatedData && updatedData.length > 0) {
        const idx = data.value.findIndex(item => item.osm_id === currentEditingRoute.value.osm_id);
        if (idx !== -1) {
            const newData = [...data.value];
            newData[idx].busStops = updatedData[0].busStops;
            data.value = newData;
        }
        closeRouteBuilder();
    }
}

function initRouteMapNative() {
    if (!process.client) return;
    import('leaflet').then(L => {
        if (routeMapInstance) {
            routeMapInstance.remove();
        }
        const mapEl = document.getElementById('routeMapNative');
        if (!mapEl) return;
        
        routeMapInstance = L.map('routeMapNative').setView([5.6037, -0.1870], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(routeMapInstance);
        
        updateRouteMapNative();
    });
}

function updateRouteMapNative() {
    if (!routeMapInstance || !process.client) return;
    import('leaflet').then(L => {
        if (routePolyline) {
            routeMapInstance.removeLayer(routePolyline);
        }
        routeMarkers.forEach(m => routeMapInstance.removeLayer(m));
        routeMarkers = [];

        const latLngs = [];
        currentRouteStops.value.forEach((stopId, index) => {
            const stop = allStops.value.find(s => s.osm_id == stopId);
            if (stop && stop.coordinates) {
                const parts = String(stop.coordinates).split(',');
                if (parts.length === 2) {
                    const lat = parseFloat(parts[1]);
                    const lon = parseFloat(parts[0]);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        latLngs.push([lat, lon]);
                        
                        let color = 'blue';
                        if (index === 0) color = 'green';
                        else if (index === currentRouteStops.value.length - 1) color = 'red';

                        const markerHtml = `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`;
                        const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
                        
                        const marker = L.marker([lat, lon], { icon }).bindPopup(`${index + 1}: ${stop.Name || 'Unnamed'}`);
                        marker.addTo(routeMapInstance);
                        routeMarkers.push(marker);
                    }
                }
            }
        });

        if (latLngs.length > 0) {
            routePolyline = L.polyline(latLngs, { color: 'blue', weight: 4, opacity: 0.7 }).addTo(routeMapInstance);
            routeMapInstance.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
        }
    });
}

</script>