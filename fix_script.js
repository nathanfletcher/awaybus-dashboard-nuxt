const fs = require('fs');
let code = fs.readFileSync('components/NativeDataTable.vue', 'utf8');

// 1. Remove Route Builder Dialog from Template
code = code.replace(
    /<!-- Route Builder Dialog -->\s*<v-dialog width="1200" v-model="showRouteBuilder">[\s\S]*?<\/v-dialog>/,
    ''
);

// 2. Remove "Edit Stops" button from actions
code = code.replace(
    /<v-btn v-if="props\.supabaseTableName === 'awayBusRoutes'"\s*color="primary" size="small" variant="tonal" @click\.stop="openRouteBuilder\(item\)">Edit Stops<\/v-btn>/,
    ''
);

// 3. Update the watch(showAddDialog) to trigger route map init
code = code.replace(
    /if \(props\.supabaseTableName === 'awayBusStops'\) \{\n\s*initBusStopMap\('busStopAddMapNative', tableObjectTemplate\);\n\s*\}/,
    `if (props.supabaseTableName === 'awayBusStops') {
            initBusStopMap('busStopAddMapNative', tableObjectTemplate);
        } else if (props.supabaseTableName === 'awayBusRoutes') {
            currentRouteStops.value = [];
            if (allStops.value.length === 0) fetchAllStops().then(() => initRouteMapNative('routeMapNativeAdd'));
            else setTimeout(() => initRouteMapNative('routeMapNativeAdd'), 300);
        }`
);

// 4. Update the openEditDialog to trigger route map init
code = code.replace(
    /if \(props\.supabaseTableName === 'awayBusStops'\) \{\n\s*initBusStopMap\('busStopEditMapNative', tableObject\);\n\s*\}/,
    `if (props.supabaseTableName === 'awayBusStops') {
            initBusStopMap('busStopEditMapNative', tableObject);
        } else if (props.supabaseTableName === 'awayBusRoutes') {
            try {
                const stops = typeof tableObject.value.busStops === 'string' ? JSON.parse(tableObject.value.busStops) : tableObject.value.busStops;
                currentRouteStops.value = Array.isArray(stops) ? [...stops] : [];
            } catch(e) { currentRouteStops.value = []; }
            if (allStops.value.length === 0) fetchAllStops().then(() => initRouteMapNative('routeMapNativeEdit'));
            else setTimeout(() => initRouteMapNative('routeMapNativeEdit'), 300);
        }`
);

// 5. Update save operations to include currentRouteStops for awayBusRoutes
code = code.replace(
    /let payload = Object\.assign\(\{\}, toRaw\(tableObjectTemplate\.value\)\);/,
    `let payload = Object.assign({}, toRaw(tableObjectTemplate.value));\n    if (props.supabaseTableName === 'awayBusRoutes') payload.busStops = currentRouteStops.value;`
);

code = code.replace(
    /let payload = Object\.assign\(\{\}, toRaw\(tableObject\.value\)\);/,
    `let payload = Object.assign({}, toRaw(tableObject.value));\n    if (props.supabaseTableName === 'awayBusRoutes') payload.busStops = currentRouteStops.value;`
);


// 6. Rewrite initRouteMapNative and updateRouteMapNative to support interactive allStops
code = code.replace(
    /function initRouteMapNative\(\) \{[\s\S]*?\}\n\nfunction updateRouteMapNative\(\) \{[\s\S]*?\}\n/,
    `function initRouteMapNative(mapId) {
    if (!process.client) return;
    import('leaflet').then(L => {
        if (routeMapInstance) routeMapInstance.remove();
        
        const mapEl = document.getElementById(mapId);
        if (!mapEl) return;
        
        routeMapInstance = L.map(mapId).setView([5.6037, -0.1870], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(routeMapInstance);
        
        updateRouteMapNative();
    });
}

function updateRouteMapNative() {
    if (!routeMapInstance || !process.client) return;
    import('leaflet').then(L => {
        if (routePolyline) routeMapInstance.removeLayer(routePolyline);
        routeMarkers.forEach(m => routeMapInstance.removeLayer(m));
        routeMarkers = [];

        // 1. Draw ALL available stops as small gray clickable dots
        allStops.value.forEach(stop => {
            if (stop.coordinates) {
                const parts = String(stop.coordinates).split(',');
                if (parts.length === 2) {
                    const lat = parseFloat(parts[1]);
                    const lon = parseFloat(parts[0]);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        const isSelected = currentRouteStops.value.includes(stop.osm_id);
                        if (!isSelected) {
                            const marker = L.circleMarker([lat, lon], {
                                radius: 5, color: '#888', fillColor: '#ccc', fillOpacity: 0.6, weight: 1
                            }).bindTooltip(stop.Name || 'Unnamed');
                            
                            marker.on('click', () => addStopToRoute(stop));
                            marker.addTo(routeMapInstance);
                            routeMarkers.push(marker);
                        }
                    }
                }
            }
        });

        // 2. Draw selected route stops and polyline
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
                        let color = '#3b82f6'; // blue
                        if (index === 0) color = '#22c55e'; // green (start)
                        else if (index === currentRouteStops.value.length - 1) color = '#ef4444'; // red (end)

                        const markerHtml = \`<div style="background-color: \${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>\`;
                        const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [14, 14], iconAnchor: [7, 7] });
                        
                        const marker = L.marker([lat, lon], { icon }).bindPopup(\`\${index + 1}: \${stop.Name || 'Unnamed'}\`);
                        marker.addTo(routeMapInstance);
                        routeMarkers.push(marker);
                    }
                }
            }
        });

        if (latLngs.length > 1) {
            routePolyline = L.polyline(latLngs, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(routeMapInstance);
        }
        
        // Auto-fit bounds only if there are stops and we haven't done it yet this session
        if (latLngs.length > 0 && !routeMapInstance.hasFitted) {
            routeMapInstance.fitBounds(L.polyline(latLngs).getBounds(), { padding: [50, 50], maxZoom: 16 });
            routeMapInstance.hasFitted = true;
        }
    });
}
`
);

// 7. Remove dead functions openRouteBuilder, closeRouteBuilder, saveRouteStops
code = code.replace(/async function openRouteBuilder\(route\) \{[\s\S]*?\}\n\nfunction closeRouteBuilder\(\) \{[\s\S]*?\}\n\nasync function saveRouteStops\(\) \{[\s\S]*?\}\n/, '');

// 8. Make sure to reset map fitted state when opening Add/Edit dialogs
code = code.replace(
    /currentRouteStops\.value = \[\];\n\s*if \(allStops\.value\.length === 0\)/,
    `currentRouteStops.value = [];\n            if (routeMapInstance) routeMapInstance.hasFitted = false;\n            if (allStops.value.length === 0)`
);
code = code.replace(
    /\} catch\(e\) \{ currentRouteStops\.value = \[\]; \}\n\s*if \(allStops\.value\.length === 0\)/,
    `} catch(e) { currentRouteStops.value = []; }\n            if (routeMapInstance) routeMapInstance.hasFitted = false;\n            if (allStops.value.length === 0)`
);


fs.writeFileSync('components/NativeDataTable.vue', code);
