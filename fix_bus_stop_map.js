const fs = require('fs');
const file = 'components/DataTableJs.vue';
let content = fs.readFileSync(file, 'utf8');

// Replace Add/Edit Dialogs to include Map for bus stops
const newAddDialog = `
                <v-col cols="auto">
                    <v-dialog :width="props.supabaseTableName === 'awayBusStops' ? 1000 : 400" v-model=showAddDialog>
                        <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props">Add {{ props.tableName }}</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card>
                            <v-overlay v-model="isSaving" contained persistent class="align-center justify-center">
                                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                            </v-overlay>
                            <v-toolbar color="primary" title="Add Record"></v-toolbar>
                            <v-card-text>
                                <v-row>
                                    <v-col :cols="props.supabaseTableName === 'awayBusStops' ? 6 : 12">
                                        <div style="max-height: 500px; overflow-y: auto;">
                                            <div v-for="jsonKey in Object.keys(tableObjectTemplate)" :key="jsonKey">
                                                <v-text-field v-if="jsonKey==props.supabaseTableId"
                                                v-model="tableObjectTemplate[jsonKey]"
                                                disabled
                                                :label="jsonKey"
                                                ></v-text-field>
                                                <v-text-field v-else
                                                v-model="tableObjectTemplate[jsonKey]"
                                                :label="jsonKey"
                                                @input="updateBusStopMapFromInput"
                                                ></v-text-field>
                                            </div> 
                                        </div>
                                    </v-col>
                                    <v-col cols="6" v-if="props.supabaseTableName === 'awayBusStops'">
                                        <h3>Stop Location</h3>
                                        <p class="text-caption">Click the map or drag the marker to set coordinates.</p>
                                        <div id="busStopAddMap" style="height: 400px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                                <v-card-actions class="justify-end">
                                    <v-btn color="primary" variant="tonal" @click="createSupabaseRow"
                                        >Create</v-btn
                                    >
                                    <v-btn variant="text" @click="closeAddDialog"
                                        >Close</v-btn
                                    >
                                </v-card-actions>
                        </v-card>
                        </template>
                    </v-dialog>
                </v-col>
`;

const newEditDialog = `
                <v-col cols="auto">
                    <v-dialog :width="props.supabaseTableName === 'awayBusStops' ? 1000 : 400" v-model=showEditDialog>
                        <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props" :disabled="selectedRows.length!=1 " @click="openEditDialog">Edit</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card>
                            <v-overlay v-model="isSaving" contained persistent class="align-center justify-center">
                                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                            </v-overlay>
                            <v-toolbar color="primary" title="Editing Record"></v-toolbar>
                            <v-card-text>
                                <v-row>
                                    <v-col :cols="props.supabaseTableName === 'awayBusStops' ? 6 : 12">
                                        <div style="max-height: 500px; overflow-y: auto;">
                                            <template v-for="jsonKey in Object.keys(tableObject)" :key="jsonKey">
                                                <v-text-field v-if="jsonKey==props.supabaseTableId"
                                                v-model="tableObject[jsonKey]"
                                                disabled
                                                :label="jsonKey"
                                                ></v-text-field>
                                                <v-text-field v-else
                                                v-model="tableObject[jsonKey]"
                                                :label="jsonKey"
                                                @input="updateBusStopMapFromInput"
                                                ></v-text-field>
                                            </template> 
                                        </div>
                                    </v-col>
                                    <v-col cols="6" v-if="props.supabaseTableName === 'awayBusStops'">
                                        <h3>Stop Location</h3>
                                        <p class="text-caption">Click the map or drag the marker to update coordinates.</p>
                                        <div id="busStopEditMap" style="height: 400px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                                <v-card-actions class="justify-end">
                                    <v-btn color="primary" variant="tonal" @click="editSupabaseRow"
                                        >Save</v-btn
                                    >
                                    <v-btn variant="text" @click="closeEditDialog"
                                        >Close</v-btn
                                    >
                            </v-card-actions>
                        </v-card>
                        </template>
                    </v-dialog>
                </v-col>
`;

content = content.replace(/<v-col cols="auto">\\s*<v-dialog :width="props.supabaseTableName === 'awayBusStops' \\? 1000 : 400" v-model=showAddDialog>[\\s\\S]*?<\\/v-col>/, newAddDialog);
content = content.replace(/<v-col cols="auto">\\s*<v-dialog :width="props.supabaseTableName === 'awayBusStops' \\? 1000 : 400" v-model=showEditDialog>[\\s\\S]*?<\\/v-col>/, newEditDialog);

// Add bus stop map logic
const mapLogic = \`
    let isSaving = ref(false);
    let busStopMapInstance = null;
    let busStopMarker = null;

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

                // Handle Map Clicks
                busStopMapInstance.on('click', function(e) {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    busStopMarker.setLatLng([lat, lng]);
                    if (!busStopMapInstance.hasLayer(busStopMarker)) {
                        busStopMarker.addTo(busStopMapInstance);
                    }
                    targetObject.value.coordinates = \`\${lng},\${lat}\`;
                });

                // Handle Marker Drags
                busStopMarker.on('dragend', function(e) {
                    const lat = busStopMarker.getLatLng().lat;
                    const lng = busStopMarker.getLatLng().lng;
                    targetObject.value.coordinates = \`\${lng},\${lat}\`;
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

    watch(showAddDialog, (val) => {
        if (val && props.supabaseTableName === 'awayBusStops') {
            initBusStopMap('busStopAddMap', tableObjectTemplate);
        } else if (!val && busStopMapInstance) {
            busStopMapInstance.remove();
            busStopMapInstance = null;
        }
    });

    function openEditDialog() {
        showEditDialog.value = true;
        if (props.supabaseTableName === 'awayBusStops') {
            initBusStopMap('busStopEditMap', tableObject);
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
\`;

content = content.replace('let showRouteBuilder = ref(false);', mapLogic + '\\n    let showRouteBuilder = ref(false);');

fs.writeFileSync(file, content);
console.log('Done mapping bus stops.');
