<template>
    <div id="supabaseTable">
        <div class="controlPanel"></div>
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
    import { defineProps, defineEmits } from 'vue';
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
    const {data} =  await useAsyncData('awayBusDrivers', async () => {
        const { data } = await client.from(props.supabaseTable).select(queryColumns)
        //console.log(data)
        return data;
    })
    //let drivers = await client.from('awayBusDrivers').select().order('created_at').data;

    //drivers.value = getNextBatchOfDrivers({ page: currentPage.value, itemsPerPage: 5, sortBy: 'id' })
    console.log('this is the drivers',data.value)
    tableHeaders.value = getTableHeaders(data.value);

    console.log('this is the table headers',tableHeaders.value)
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

    function getTableHeadersArray(json) {
        // if json is empty return empty array
        if (json.length === 0) {
            return [];
        }
        return Object.keys(json[0]);
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
        //console.log(dataTable.row('.selected').data())//
        selectedRows = dt.rows({ selected: true }).data().toArray();
        
        //dt.buttons().disable();
        console.log(selectedRows)
 
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

    async function editSupabaseRows(selectedRows){
        //let selectedRows = dt.rows({ selected: true }).data().toArray();
        const { data, error } = await supabase
        .from(props.supabaseTable)
        .upsert(selectedRows)
        .select()
        return data;
    }
    async function deleteSupabaseRows(selectedRows){
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
</script>

<style>
@import 'datatables.net-dt';
@import 'datatables.net-buttons-dt';
@import 'datatables.net-select-dt';
</style>
