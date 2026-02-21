const fs = require('fs');
let content = fs.readFileSync('components/DataTableJs.vue', 'utf8');

// 1. Refactor useAsyncData to avoid deep reactivity issues and handle SSR correctly
content = content.replace(
    /let \{data\} =  await useAsyncData\([\s\S]*?return allData;\n    \}\)/,
    `// Fetch initial dataset via SSR
    const { data: asyncData } = await useAsyncData(\`fetch_\${props.supabaseTableName}\`, async () => {
        let allData = [];
        let from = 0;
        let step = 1000;
        while (true) {
            const { data: pageData, error } = await client.from(props.supabaseTableName).select(queryColumns).range(from, from + step - 1);
            if (error) {
                console.error("Error fetching data:", error);
                break;
            }
            if (!pageData || pageData.length === 0) break;
            
            allData.push(...pageData);
            if (pageData.length < step) break;
            from += step;
        }
        return allData;
    });
    
    // Use shallowRef to prevent Vue from deeply proxying massive arrays, preventing hangs
    const data = shallowRef(asyncData.value || []);`
);

// 2. Fix the CRUD methods to update both shallowRef and DataTable directly
content = content.replace(
    /data\.value\.push\(insertedData\[0\]\);/,
    `data.value = [...data.value, insertedData[0]];\n            if (dt) dt.row.add(insertedData[0]).draw(false);`
);

content = content.replace(
    /data\.value\[idx\] = updatedData\[0\];/,
    `data.value[idx] = updatedData[0];\n                data.value = [...data.value]; // trigger shallowRef update\n                if (dt) dt.row(idx).data(updatedData[0]).draw(false);`
);

content = content.replace(
    /data\.value\.splice\(idx, 1\);/,
    `data.value.splice(idx, 1);\n                data.value = [...data.value]; // trigger shallowRef update\n                if (dt) dt.row(idx).remove().draw(false);`
);

// 3. Fix the route stops update
content = content.replace(
    /if \(idx !== -1\) data\.value\[idx\]\.busStops = updatedData\[0\]\.busStops;/,
    `if (idx !== -1) {\n                data.value[idx].busStops = updatedData[0].busStops;\n                data.value = [...data.value];\n                if (dt) dt.row(idx).data(data.value[idx]).draw(false);\n            }`
);

// 4. Fix driver verify update
content = content.replace(
    /if \(idx !== -1\) data\.value\[idx\]\.isVerified = true;/,
    `if (idx !== -1) {\n                data.value[idx].isVerified = true;\n                data.value = [...data.value];\n                if (dt) dt.row(idx).data(data.value[idx]).draw(false);\n            }`
);


// 5. Fix selected deletion
content = content.replace(
    /let idx = data\.value\.indexOf\(this\.data\(\)\);\n\s*data\.value\.splice\(idx, 1\);/,
    `let idx = data.value.indexOf(this.data());\n            if (idx !== -1) data.value.splice(idx, 1);\n            data.value = [...data.value];`
);


fs.writeFileSync('components/DataTableJs.vue', content);
