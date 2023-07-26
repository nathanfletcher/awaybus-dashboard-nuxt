<template>
    <div id="supabaseTable">
        <div class="controlPanel">
            <v-row>
                <v-col cols="auto">
                    <v-dialog transition="dialog-top-transition" width="auto">
                        <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props">Create</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card>
                            <v-toolbar
                            color="primary"
                            title="Create"
                            ></v-toolbar>
                            <v-card-text>
                            <div class="text-h2 pa-12">Hello world!</div>
                            </v-card-text>
                            <v-card-actions class="justify-end">
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
                        <v-btn color="primary" v-bind="props" >Edit</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card>
                            <v-toolbar color="primary" title="Opening from the top"></v-toolbar>
                            <v-card-text>
                            <div class="text-h2 pa-12">Hello world!</div>
                            <div>
                                // for every object in tableObject key create a div with the object's name and a v-text-field with the object's value
                                <template v-for="jsonKey in Object.keys(tableObject)" :key="jsonKey">
                                    
                                    <!-- <v-text-field v-model="tableObject[jsonKey]"></v-text-field> -->
                                    <v-text-field
                                    v-model="tableObject[jsonKey]"
                                    :label="jsonKey"
                                    ></v-text-field>
                                </template> 
                            </div>
                            </v-card-text>
                            <v-card-actions class="justify-end">
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
                        <v-btn color="primary" v-bind="props">Delete</v-btn>
                        </template>
                        <template v-slot:default="{ isActive }">
                        <v-card>
                            <v-toolbar color="primary" title="Opening from the top"></v-toolbar>
                            <v-card-text>
                            <div class="text-h2 pa-12">Hello world!</div>
                            </v-card-text>
                            <v-card-actions class="justify-end">
                            <v-btn variant="text" @click="isActive.value = false"
                                >Close</v-btn
                            >
                            </v-card-actions>
                        </v-card>
                        </template>
                    </v-dialog>
                </v-col>
            </v-row>
        </div>
        <DataTable :columns="tableHeaders" 
        :data="data" 
        ref="table"
        @select="selectCallback"
        @deselect="selectCallback"
        :options="{
            select:{ items: 'row', style:'multiple' },
            nowrap: true,
            scrollX: true,
            scrollCollapse: true,
            scrollY: 'calc(100vh - 300px)',
            dom: 'Bftip',
            buttons: [
                { text: 'test', action: action },
                { text: 'create', action: createSupabaseRow },
                { text: 'edit', action:  editSupabaseRows},
                { text: 'delete', action: deleteSupabaseRows },
                ]
            }"
        >  
            <thead>
                <tr>
                    <th v-for="column in tableHeaders" :key="column.data">
                        {{ column.data }}
                    </th>
                </tr>
            </thead>
        </DataTable>
    </div>
</template>
<script setup>
    import { defineProps} from 'vue';
   
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
            required: true
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
        supabaseTable: {
            type: String,
            required: true,
        },
        supabaseTableId: {
            type: String,
            required: true,
            default: 'id'
        }
    })
    
    definePageMeta({
        middleware: 'auth'
    })
    const date = useDate()
    const tableHeaders = ref([])
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
        const { data } = await client.from(props.supabaseTable).select(queryColumns)
        //console.log(data)
        return data;
    })
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
    
    let editAction = '<h1>no data</h1>'
    editAction = generateModalForm(editSupabaseRows)

    //let drivers = await client.from('awayBusDrivers').select().order('created_at').data;

    //drivers.value = getNextBatchOfDrivers({ page: currentPage.value, itemsPerPage: 5, sortBy: 'id' })
    //Get Table Headers from first row of data
    tableHeaders.value = getTableHeaders(toRaw(data.value[0]));

    // get count of all drivers using useAsyncData
    const {data:totalItems, pending, error} =  await useAsyncData('awayBusDriversCount', async () => {
        const { data, count,error } = await client.from('awayBusDrivers').select('*',{count:'exact'})
        console.log('total count ',count)
        return count;
    })
    

    /* watchEffect(async () => {
        if ( table.rows( { selected: true } ).indexes().length === 0 ) {
            buttons.disable();
        }
        else {
            buttons.enable();
        }
    }); */

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
        tableObject.value = dt.rows({ selected: true }).data().toArray()[0];
        
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
        .from(props.supabaseTable)
        .insert([
            { some_column: 'someValue', other_column: 'otherValue' },
        ])
        .select()

    }

    async function editSupabaseRows(){
        console.log(selectedRows)
        //let selectedRows = dt.rows({ selected: true }).data().toArray();
        /* const { data, error } = await supabase
        .from(props.supabaseTable)
        .upsert(selectedRows)
        .select()
        return data; */
    }
    async function deleteSupabaseRows(){
        if (!selectedRows.length === 0 && hasId(selectedRows[0])) {
            const { error } = await supabase
            .from(props.supabaseTable)
            .delete()
            .eq(props.supabaseTableId, selectedRows[0][props.supabaseTableId])
            return;
        }
        

    }

    // return true if json keys contain 'id'
    function hasId(json) {
        return Object.keys(json).includes('id');
    }

    // retrun html form from json
    function getForm(json, action) {
        tableObject.value = json;
        
        let formInputs =  getTableHeadersArray(json).map((key) => {
            return `
                            <v-text-field
                                    v-model="${tableObject[key]}"
                                    label="${tableObject[key]}"
                                    ></v-text-field>`
        })
        let formStructure = `<div>
                                <form @submit.prevent="${action}">
                                    ${formInputs}

                                    <v-btn
                                    class="me-4"
                                    type="submit"
                                    >
                                    submit
                                    </v-btn>

                                    <v-btn @click="handleReset">
                                    clear
                                    </v-btn>
                                </form>
                            </div>`
        
        return formStructure;
    }
</script>

<style>
@import 'datatables.net-dt';
@import 'datatables.net-buttons-dt';
@import 'datatables.net-select-dt';
</style>
