<template>
    <div id="supabaseTable">
        <div class="controlPanel">
            <v-row>
                <v-col cols="auto">
                    <v-dialog width="auto">
                        <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props">Add {{ props.tableName }}</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card width="400">
                            <v-toolbar color="primary" title="Add"></v-toolbar>
                            <v-card-text>
                                <template v-for="jsonKey in Object.keys(tableObjectTemplate)" :key="jsonKey">
                                    <v-text-field
                                    v-model="tableObjectTemplate[jsonKey]"
                                    :label="jsonKey"
                                    ></v-text-field>
                                </template> 
                            </v-card-text>
                                <v-card-actions class="justify-end">
                                    <v-btn color="primary" variant="tonal" @click="isActive.value = false"
                                        >Create</v-btn
                                    >
                                    <v-btn variant="text" @click="isActive.value = false"
                                        >Close</v-btn
                                    >
                                </v-card-actions>
                        </v-card>
                        </template>
                    </v-dialog>
                </v-col>

                <v-col cols="auto">
                    <v-dialog width="auto" v-model=showEditDialog>
                        <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props" :disabled="selectedRows.length!=1 ">Edit</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card width="400">
                            <v-toolbar color="primary" title="Editing"></v-toolbar>
                            <v-card-text>
                                <template v-for="jsonKey in Object.keys(tableObject)" :key="jsonKey">
                                    <v-text-field
                                    v-model="tableObject[jsonKey]"
                                    :label="jsonKey"
                                    ></v-text-field>
                                </template> 
                            </v-card-text>
                                <v-card-actions class="justify-end">
                                    <v-btn color="primary" variant="tonal" @click="editSupabaseRow"
                                        >Save</v-btn
                                    >
                                    <v-btn variant="text" @click="isActive.value = false"
                                        >Close</v-btn
                                    >
                            </v-card-actions>
                        </v-card>
                        </template>
                    </v-dialog>
                </v-col>

                <v-col cols="auto">
                    <v-dialog transition="dialog-top-transition" width="auto">
                        <template v-slot:activator="{ props }">
                        <v-btn color="warning" v-bind="props" :disabled="!selectedRows.length>0">Delete</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card>
                            <v-toolbar color="warning" title="Delete"></v-toolbar>
                            <v-card-text>
                            <div class="text-h4 pa-12">Are you sure you want to delete these {{ selectedRows.length }} items?</div>
                                <DataTable :columns="localTableHeaders"
                                    :data="selectedRows" >
                                    <thead>
                                        <tr>
                                            <th v-for="column in localTableHeaders" :key="column.data">
                                                {{ column.data }}
                                            </th>
                                        </tr>
                                    </thead>
                                </DataTable>
                            </v-card-text>
                            <v-card-actions class="justify-end">
                            <v-btn color="danger" variant="tonal" @click="isActive.value = flase"
                                >Yes Delete</v-btn
                            >
                            <v-btn color="primary" variant="tonal" @click="isActive.value = false"
                                >No Close</v-btn
                            >
                            </v-card-actions>
                        </v-card>
                        </template>
                    </v-dialog>
                </v-col>
            </v-row>
        </div>
        <DataTable :columns="localTableHeaders" 
        :data="data" 
        ref="table"
        @select="selectCallback"
        @deselect="selectCallback"
        :options="{
            pageLength: 50,
            lengthChange: false,
            lengthMenu: [ 50, 75, 100,300,500 ],
            select:{ items: 'row', style:'multiple' },
            nowrap: true,
            scrollX: true,
            scrollCollapse: true,
            scrollY: 'calc(100vh - 300px)',
            dom: 'Bftip',
            }"
        >  
            <thead>
                <tr>
                    <th v-for="column in localTableHeaders" :key="column.data">
                        {{ column.data }}
                    </th>
                </tr>
            </thead>
        </DataTable>
    </div>
</template>
<script setup>
    import DataTablesCore from 'datatables.net';
    import DataTable from 'datatables.net-vue3';
    import Select from 'datatables.net-select';
    import Editor from 'datatables.net-editor';
    import Buttons from 'datatables.net-buttons';   
    import 'datatables.net-buttons/js/buttons.html5'; 

    DataTable.use(DataTablesCore);
    // DataTable.use(Select);
    DataTable.use(Editor);
    DataTable.use(Buttons);

    import { useDate } from 'vuetify/labs/date'


    const props = defineProps({
        data: {
            type: Array,
            required: false
        },
        tableHeaders: {
            type: Array,
            required: false
        },
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
    })
    
    const date = useDate()
    const localTableHeaders = ref()
    const client = useSupabaseClient()
    const user = useSupabaseUser()
    //const itemsPerPage = ref(5)
    const currentPage = ref(1)
    //const totalItems = ref(0)
   //const drivers = ref([])
    const loading = ref(false)
    const queryColumns = props.supabaseColumns
    let selectedRows = ref([])
    let tableObject = ref({});
    let tableObjectTemplate={};
    let showEditDialog = ref(false);

    let dt;
    let editor;
    const table = ref()
    let buttons = ref()
    //const dataTable = this.$refs.table.dt; // This variable is used in the `ref` attribute for the component
    
    onMounted(function () {
        dt = table.value.dt;
        buttons = dt.buttons( ['.edit', '.delete'] );
        //dt.buttons().disable();
        selectCallback()
        /* this.$refs.table.dt()
        .on( 'select', function ( e, dt, type, indexes ) {
            var rowData = dt.rows( indexes ).data().toArray();
            console.log(rowData);
        } ) */
        
    }); 
    // const { data:drivers, error } = await useAsyncData('drivers', async () => {
    //     return await client.from('awayBusDrivers').select().order('created_at')
    // })
    
    // get all data using useAsyncData
    let {data} =  await useAsyncData('awayBusDrivers', async () => {
        const { data } = await client.from(props.supabaseTableName).select(queryColumns).limit(1000)
        
        tableObjectTemplate =  clearObject(data[0])
        console.log("Data total ",data.length)
        return data;
    })
    //tableObjectTemplate = clearObject(toRaw(data.value[0]))
    // generate modal form if data has content
    const generateModalForm = (action) => {
        console.log('this is the action',action)
        console.log('this is the data first value',toRaw(data.value[0]))
        if(data.value.length > 0){
            return getForm(toRaw(data.value[0]),action)
        }
        else{
            return '<h1>no data</h1>'
        }
    }
    
    //let drivers = await client.from('awayBusDrivers').select().order('created_at').data;

    //drivers.value = getNextBatchOfDrivers({ page: currentPage.value, itemsPerPage: 5, sortBy: 'id' })
    //Get Table Headers from first row of data
    if(props.tableHeaders != undefined){
        localTableHeaders.value = props.tableHeaders
    }
    else{
        localTableHeaders.value = getTableHeaders(toRaw(data.value[0]));
    }
    //tableHeaders.value = getTableHeaders(toRaw(data.value[0]));

    // get count of all drivers using useAsyncData
    /* const {data:totalItems, pending, error} =  await useAsyncData('awayBusDriversCount', async () => {
        const { data, count,error } = await client.from('awayBusDrivers').select('*',{count:'exact'})
        console.log('total count ',count)
        return count;
    }) */
    

    async function getNextBatchOfDrivers({ page, itemsPerPage, sortBy }) {
        console.log("current page",page)
        console.log("items",itemsPerPage)
        const { data } = await client.from('awayBusDrivers').select().range((page-1)*itemsPerPage,itemsPerPage.value).limit(itemsPerPage).order('id', { ascending: true })
        drivers.value = data;
        console.log(data)
        //return data;
    }

    async function getAllDrivers() {
        console.log('this is page', currentPage.value) 
        loading.value = true;
        let result =  await useAsyncData('awayBusDrivers', async () => {
            const { data } = await client.from('awayBusDrivers').select().range(currentPage.value,(currentPage.value ) * itemsPerPage.value)//.range(currentPage.value, currentPage.value+itemsPerPage.value)//.limit(itemsPerPage.value).range((currentPage.value - 1) * itemsPerPage.value).order('created_at', { ascending: false })
            // console.log(data)
            drivers.value = data;
            return data;
        })
        loading.value = false;
        return result;
    }

    const driverLength = () => {
        // if drivers is an array and it is empty return an empty array
        if (Array.isArray(drivers.value) && drivers.value.length === 0) {
            return 0;
        }
        return drivers.value.length;
    }

    // add a new driver using a function
    async function addDriver(name,phoneNumber,carNumber,station, carColour, carModel, isVerified){
        const { data, error } = await client.from('awayBusDrivers').insert([
            { name, phoneNumber, carNumber, station, carColour, carModel, isVerified }
        ])
        if (error) {
            console.log(error)
        }
        else {
            console.log(data[0])
            return data;
        }
    }

    // remove all values from json object
    function clearObject(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                //delete obj[key];
                obj[key] = '';
            }
        }
        return obj;
    }

    function getTableHeadersArray(jsonArray) {
        
        // if json is empty return empty array
        if (jsonArray.length === 0) {
            return [];
        }
        return Object.keys(jsonArray);
    }

    //  map json keys to the format {
    //       title: 'Dessert (100g serving)',
    //       align: 'start',
    //       sortable: false,
    //       key: 'name',
    //     }
    function getTableHeaders(json) {
        
        let result =  getTableHeadersArray(json).map((key) => {
            return {
                data:key,
                defaultContent: "Not set"
            }
        })
        return result;
    }


    //const { data, error } = await client.from('awayBusDrivers').select().order('created_at')

    function action() {
        
      //alert(12);
      //console.log(table.value.rows().data())
      console.log(dt)
      console.log(dt.rows({ selected: true }).data()); 
      dt.rows({ selected: true }).every(function () {
            let idx = data.value.indexOf(this.data());
            data.value.splice(idx, 1);
        });
      /* this.editor
        .title('Add new record')
        .buttons('Save')
        .create(); */
    }
    function selectCallback(data, type, selected) {
        //console.log(type)
        console.log(); 
        console.log(toRaw(dt.rows({ selected: true }).data().toArray()[0]))//
        selectedRows.value = toRaw(dt.rows({ selected: true }).data().toArray());
        tableObject = toRaw(dt.rows({ selected: true }).data().toArray()[0]);
        
        //dt.buttons().disable();
        //console.log(selectedRows)
 
        if ( selectedRows.length > 0 ) {
            dt.buttons().enable();
            console.log(selectedRows[0].created_at)
        }
        else {
            dt.buttons().disable();
        }

    }
    async function createSupabaseRow(){

        const { data, error } = await supabase
        .from(props.supabaseTableName)
        .insert([
            { some_column: 'someValue', other_column: 'otherValue' },
        ])
        .select()

    }

    async function editSupabaseRow(){
        console.log(tableObject.name)
        //let selectedRows = dt.rows({ selected: true }).data().toArray();
        const { data, error } = await client
        .from(props.supabaseTableName)
        .upsert(tableObject)
        .select()
        selectedRows[0] = data;
        if (error) {
            console.log(error)
        }
        else {
            console.log(data)
            selectedRows = data;
            showEditDialog.value = false;
            // update dt row
            dt.row({ selected: true }).data(data[0]);
            return data;
        }
        
    }
    async function deleteSupabaseRows(){
        if (!selectedRows.length === 0 && hasId(selectedRows[0])) {
            const { error } = await supabase
            .from(props.supabaseTableName)
            .delete()
            .eq(props.supabaseTableId, selectedRows[0][props.supabaseTableId])
            return;
        }
        

    }

    // return true if json keys contain 'id'
    function hasId(json) {
        return Object.keys(json).includes('id');
    }

   
</script>

<style>
@import 'datatables.net-dt';
@import 'datatables.net-buttons-dt';
@import 'datatables.net-select-dt';
</style>
