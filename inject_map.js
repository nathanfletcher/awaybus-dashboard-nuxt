const fs = require('fs');
const file = 'components/DataTableJs.vue';
let content = fs.readFileSync(file, 'utf8');

const newDialog = `                <v-col cols="auto">
                    <v-dialog width="1200" v-model="showRouteBuilder">
                        <v-card>
                            <v-toolbar color="secondary" title="Interactive Route Builder"></v-toolbar>
                            <v-card-text>
                                <v-alert type="info" class="mb-4">Select stops to add them to the route. Map will preview the path.</v-alert>
                                <v-row>
                                    <v-col cols="4">
                                        <h3>Available Stops</h3>
                                        <v-text-field v-model="stopSearch" label="Search Stops" density="compact" hide-details class="mb-2"></v-text-field>
                                        <v-list height="450" style="overflow-y: auto" border>
                                            <v-list-item v-for="stop in filteredStops" :key="stop.osm_id" @click="addStopToRoute(stop)">
                                                <v-list-item-title>{{ stop.Name || 'Unnamed' }}</v-list-item-title>
                                                <v-list-item-subtitle>{{ stop.osm_id }}</v-list-item-subtitle>
                                                <template v-slot:append>
                                                    <v-icon icon="mdi-plus" color="success"></v-icon>
                                                </template>
                                            </v-list-item>
                                        </v-list>
                                    </v-col>
                                    <v-col cols="5">
                                        <h3>Route Map</h3>
                                        <div id="routeMap" style="height: 450px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                    </v-col>
                                    <v-col cols="3">
                                        <h3>Route Order</h3>
                                        <v-list height="450" style="overflow-y: auto" border>
                                            <v-list-item v-for="(stopId, index) in currentRouteStops" :key="index">
                                                <v-list-item-title>{{ getStopName(stopId) }}</v-list-item-title>
                                                <template v-slot:append>
                                                    <v-btn icon="mdi-arrow-up" variant="text" size="small" @click="moveStop(index, -1)" :disabled="index === 0"></v-btn>
                                                    <v-btn icon="mdi-arrow-down" variant="text" size="small" @click="moveStop(index, 1)" :disabled="index === currentRouteStops.length - 1"></v-btn>
                                                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeStop(index)"></v-btn>
                                                </template>
                                            </v-list-item>
                                        </v-list>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" @click="saveRouteStops">Save Route</v-btn>
                                <v-btn variant="text" @click="closeRouteBuilder">Close</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                </v-col>`;

// Replace old dialog
content = content.replace(/<v-col cols="auto">\s*<v-dialog width="800" v-model="showRouteBuilder">[\s\S]*?<\/v-dialog>\s*<\/v-col>/, newDialog);

// Fix fetchAllStops
content = content.replace(/select\('osm_id, Name'\)/, "select('osm_id, Name, coordinates')");

// Add map logic
const mapLogic = \`
    let mapInstance = null;
    let mapPolyline = null;
    let mapMarkers = [];

    function updateMap() {
        if (!process.client) return;
        import('leaflet').then(L => {
            if (!mapInstance) {
                const mapEl = document.getElementById('routeMap');
                if (!mapEl) return;
                mapInstance = L.map('routeMap').setView([5.6037, -0.1870], 12);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(mapInstance);
            }
            
            if (mapPolyline) mapInstance.removeLayer(mapPolyline);
            mapMarkers.forEach(m => mapInstance.removeLayer(m));
            mapMarkers = [];
            
            let latlngs = [];
            currentRouteStops.value.forEach((id, index) => {
                const stop = allStops.value.find(s => s.osm_id == id);
                if (stop && stop.coordinates) {
                    const parts = String(stop.coordinates).split(',');
                    if (parts.length === 2) {
                        const lat = parseFloat(parts[1]);
                        const lon = parseFloat(parts[0]);
                        latlngs.push([lat, lon]);
                        
                        const marker = L.circleMarker([lat, lon], {
                            radius: 6,
                            fillColor: index === 0 ? 'green' : (index === currentRouteStops.value.length -1 ? 'red' : 'blue'),
                            color: '#fff',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).bindTooltip((index + 1) + '. ' + (stop.Name || String(id)), { permanent: true, direction: 'top' }).addTo(mapInstance);
                        mapMarkers.push(marker);
                    }
                }
            });
            
            if (latlngs.length > 1) {
                mapPolyline = L.polyline(latlngs, {color: '#2196F3', weight: 4, opacity: 0.7}).addTo(mapInstance);
                mapInstance.fitBounds(mapPolyline.getBounds(), { padding: [20, 20] });
            } else if (latlngs.length === 1) {
                mapInstance.setView(latlngs[0], 15);
            }
        });
    }

    watch(currentRouteStops, () => {
        if (showRouteBuilder.value) {
            updateMap();
        }
    }, { deep: true });

    function closeRouteBuilder() {
        showRouteBuilder.value = false;
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }
    }
\`;

content = content.replace(/showRouteBuilder\\.value = true;/, "showRouteBuilder.value = true;\\n        setTimeout(updateMap, 300);");
content = content.replace('let currentEditingRoute = ref(null);', 'let currentEditingRoute = ref(null);\\n' + mapLogic);

fs.writeFileSync(file, content);
console.log("Done adding map logic!");
