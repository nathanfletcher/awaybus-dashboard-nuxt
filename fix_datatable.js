const fs = require('fs');
const file = 'components/DataTableJs.vue';
let content = fs.readFileSync(file, 'utf8');

// replace tableObject declarations
content = content.replace(
  /let tableObject = toRaw\(\{\}\);\n    let tableObjectTemplate=reactive\(\{\}\);/,
  `let tableObject = ref({});\n    let tableObjectTemplate = ref({});`
);

// replace initial assignment of tableObjectTemplate
content = content.replace(
  /if \(data\.value && data\.value\.length > 0\) \{\n        tableObjectTemplate = clearObject\(Object\.assign\(\{\}, toRaw\(data\.value\[0\]\)\)\)\n        \/\/ delete id key from tableObjectTemplate\n        delete tableObjectTemplate\[props\.supabaseTableId\]\n        delete tableObjectTemplate\["created_at"\]\n    \}/,
  `if (data.value && data.value.length > 0) {
        let tmpl = clearObject(Object.assign({}, toRaw(data.value[0])))
        delete tmpl[props.supabaseTableId]
        delete tmpl["created_at"]
        tableObjectTemplate.value = tmpl;
    }`
);

// replace onMounted
content = content.replace(
  /onMounted\(function \(\) \{\n        dt = table\.value\.dt;\n        buttons = dt\.buttons\( \[\'\.edit\', \'\.delete\'\] \);\n        \/\/dt\.buttons\(\)\.disable\(\);\n        selectCallback\(\)/,
  `onMounted(function () {
        dt = markRaw(table.value.dt);
        buttons = markRaw(dt.buttons( ['.edit', '.delete'] ));
        selectCallback()`
);

// replace selectCallback
content = content.replace(
  /function selectCallback\(data, type, selected\) \{\n[\s\S]*?if \( selectedRows\.length > 0 \) \{\n            dt\.buttons\(\)\.enable\(\);\n            console\.log\(selectedRows\[0\]\.created_at\)\n        \}\n        else \{\n            dt\.buttons\(\)\.disable\(\);\n        \}\n\n    \}/,
  `function selectCallback(e, dtInstance, type, indexes) {
        if (!dt) return;
        const selectedData = dt.rows({ selected: true }).data().toArray();
        selectedRows.value = selectedData;
        if (selectedData.length > 0) {
            let rowData = Object.assign({}, toRaw(selectedData[0]));
            for (let key in rowData) {
                if (typeof rowData[key] === 'object' && rowData[key] !== null) {
                    rowData[key] = JSON.stringify(rowData[key]);
                }
            }
            tableObject.value = rowData;
            dt.buttons().enable();
        } else {
            tableObject.value = {};
            dt.buttons().disable();
        }
    }`
);

// replace createSupabaseRow
content = content.replace(
  /async function createSupabaseRow\(\)\{[\s\S]*?return data;\n        \}\n        \n    \}/,
  `async function createSupabaseRow(){
        let payload = Object.assign({}, toRaw(tableObjectTemplate.value));
        let finalPayload = {};
        for (let key in payload) {
            if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
                continue;
            }
            if (typeof payload[key] === 'string' && (payload[key].startsWith('[') || payload[key].startsWith('{'))) {
                try {
                    finalPayload[key] = JSON.parse(payload[key]);
                } catch(e) {
                    finalPayload[key] = payload[key];
                }
            } else {
                finalPayload[key] = payload[key];
            }
        }

        const { data: insertedData, error } = await client
        .from(props.supabaseTableName)
        .insert(finalPayload)
        .select()
        if (error) {
            console.log(error)
        }
        else {
            data.value.push(insertedData[0]);
            let tmpl = clearObject(Object.assign({}, toRaw(tableObjectTemplate.value)));
            tableObjectTemplate.value = tmpl;
            showAddDialog.value = false;
            return insertedData;
        }
    }`
);

// replace editSupabaseRow
content = content.replace(
  /async function editSupabaseRow\(\)\{[\s\S]*?return data;\n        \}\n        \n    \}/,
  `async function editSupabaseRow(){
        let payload = Object.assign({}, toRaw(tableObject.value));
        let finalPayload = {};
        for (let key in payload) {
            if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
                continue;
            }
            if (typeof payload[key] === 'string' && (payload[key].startsWith('[') || payload[key].startsWith('{'))) {
                try {
                    finalPayload[key] = JSON.parse(payload[key]);
                } catch(e) {
                    finalPayload[key] = payload[key];
                }
            } else {
                finalPayload[key] = payload[key];
            }
        }

        const { data: updatedData, error } = await client
        .from(props.supabaseTableName)
        .upsert(finalPayload)
        .select()
        
        if (error) {
            console.log(error)
        }
        else {
            const updatedId = updatedData[0][props.supabaseTableId];
            const idx = data.value.findIndex(item => item[props.supabaseTableId] === updatedId);
            if (idx !== -1) {
                data.value[idx] = updatedData[0];
            }
            selectedRows.value = [updatedData[0]];
            showEditDialog.value = false;
            return updatedData;
        }
    }`
);

// replace deleteSupabaseRows
content = content.replace(
  /async function deleteSupabaseRows\(\)\{[\s\S]*?showDeleteDialog\.value = false;\n            \}     \n    \}/,
  `async function deleteSupabaseRows(){
        const deletedId = selectedRows.value[0][props.supabaseTableId];
        const { error } = await client
        .from(props.supabaseTableName)
        .delete()
        .eq(props.supabaseTableId, deletedId)
        
        if (error) {
            console.log(error)
        }
        else {
            const idx = data.value.findIndex(item => item[props.supabaseTableId] === deletedId);
            if (idx !== -1) {
                data.value.splice(idx, 1);
            }
            showDeleteDialog.value = false;
            selectedRows.value = [];
        }     
    }`
);

fs.writeFileSync(file, content);
console.log('Done replacing DataTableJs.vue');
