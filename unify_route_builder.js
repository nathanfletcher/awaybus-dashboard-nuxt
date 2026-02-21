const fs = require('fs');
let code = fs.readFileSync('components/NativeDataTable.vue', 'utf8');

// 1. Update the Add Dialog width and layout
code = code.replace(
    /:width="props\.supabaseTableName === 'awayBusStops' \? 1000 : 500" v-model="showAddDialog"/,
    `:width="['awayBusStops', 'awayBusRoutes'].includes(props.supabaseTableName) ? 1200 : 500" v-model="showAddDialog"`
);

// 2. Hide busStops field if awayBusRoutes in Add Dialog
code = code.replace(
    /v-model="tableObjectTemplate\[jsonKey\]"\n\s*:label="jsonKey"\n\s*@input="updateBusStopMapFromInput"/,
    `v-model="tableObjectTemplate[jsonKey]"\n                                                v-show="!(props.supabaseTableName === 'awayBusRoutes' && jsonKey === 'busStops')"\n                                                :label="jsonKey"\n                                                @input="updateBusStopMapFromInput"`
);

// 3. Add Route Builder UI inside Add Dialog
code = code.replace(
    /<\/v-row>\n\s*<\/v-card-text>\n\s*<v-card-actions class="justify-end pa-4">\n\s*<v-btn variant="text" @click="closeAddDialog">Cancel<\/v-btn>\n\s*<v-btn color="primary" variant="elevated" @click="createSupabaseRow">Create<\/v-btn>/,
    `</v-row>
                            <v-divider class="my-4" v-if="props.supabaseTableName === 'awayBusRoutes'"></v-divider>
                            <v-row v-if="props.supabaseTableName === 'awayBusRoutes'">
                                <v-col cols="4">
                                    <h3>Available Stops</h3>
                                    <v-text-field v-model="stopSearch" label="Search Stops" density="compact" variant="outlined" hide-details class="mb-2" prepend-inner-icon="mdi-magnify"></v-text-field>
                                    <v-list height="400" style="overflow-y: auto" border class="rounded">
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
                                    <h3>Route Map <span class="text-caption font-weight-regular ml-2">(Click gray dots to add)</span></h3>
                                    <div id="routeMapNativeAdd" style="height: 400px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                </v-col>
                                <v-col cols="3">
                                    <h3>Route Order</h3>
                                    <v-list height="400" style="overflow-y: auto" border class="rounded">
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
                        <v-card-actions class="justify-end pa-4">
                            <v-btn variant="text" @click="closeAddDialog">Cancel</v-btn>
                            <v-btn color="primary" variant="elevated" @click="createSupabaseRow">Create</v-btn>`
);

// 4. Update the Edit Dialog width and layout
code = code.replace(
    /:width="props\.supabaseTableName === 'awayBusStops' \? 1000 : 500" v-model="showEditDialog"/,
    `:width="['awayBusStops', 'awayBusRoutes'].includes(props.supabaseTableName) ? 1200 : 500" v-model="showEditDialog"`
);

// 5. Hide busStops field if awayBusRoutes in Edit Dialog
code = code.replace(
    /v-model="tableObject\[jsonKey\]"\n\s*:label="jsonKey"\n\s*@input="updateBusStopMapFromInput"/,
    `v-model="tableObject[jsonKey]"\n                                                v-show="!(props.supabaseTableName === 'awayBusRoutes' && jsonKey === 'busStops')"\n                                                :label="jsonKey"\n                                                @input="updateBusStopMapFromInput"`
);

// 6. Add Route Builder UI inside Edit Dialog
code = code.replace(
    /<\/v-row>\n\s*<\/v-card-text>\n\s*<v-card-actions class="justify-end pa-4">\n\s*<v-btn variant="text" @click="closeEditDialog">Cancel<\/v-btn>\n\s*<v-btn color="secondary" variant="elevated" @click="editSupabaseRow">Save Changes<\/v-btn>/,
    `</v-row>
                            <v-divider class="my-4" v-if="props.supabaseTableName === 'awayBusRoutes'"></v-divider>
                            <v-row v-if="props.supabaseTableName === 'awayBusRoutes'">
                                <v-col cols="4">
                                    <h3>Available Stops</h3>
                                    <v-text-field v-model="stopSearch" label="Search Stops" density="compact" variant="outlined" hide-details class="mb-2" prepend-inner-icon="mdi-magnify"></v-text-field>
                                    <v-list height="400" style="overflow-y: auto" border class="rounded">
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
                                    <h3>Route Map <span class="text-caption font-weight-regular ml-2">(Click gray dots to add)</span></h3>
                                    <div id="routeMapNativeEdit" style="height: 400px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                </v-col>
                                <v-col cols="3">
                                    <h3>Route Order</h3>
                                    <v-list height="400" style="overflow-y: auto" border class="rounded">
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
                        <v-card-actions class="justify-end pa-4">
                            <v-btn variant="text" @click="closeEditDialog">Cancel</v-btn>
                            <v-btn color="secondary" variant="elevated" @click="editSupabaseRow">Save Changes</v-btn>`
);


fs.writeFileSync('components/NativeDataTable.vue', code);
