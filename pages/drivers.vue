<template>
    <div>
        <h1>Getting all drivers</h1>
        <DataTable :columns="tableHeaders" 
        :data="drivers" 
        :options="{
            select:true

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
    import DataTable from 'datatables.net-vue3';
    
    import DataTablesCore from 'datatables.net';
    import Select from 'datatables.net-select';

    DataTable.use(DataTablesCore);
    DataTable.use(Select);

    import { useDate } from 'vuetify/labs/date'
    
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

    
    
    // const { data:drivers, error } = await useAsyncData('drivers', async () => {
    //     return await client.from('awayBusDrivers').select().order('created_at')
    // })

    // get all drivers using useAsyncData
    const {data:drivers} =  await useAsyncData('awayBusDrivers', async () => {
        const { data } = await client.from('awayBusDrivers').select().order('created_at')
        //console.log(data)
        return data;
    })
    //let drivers = await client.from('awayBusDrivers').select().order('created_at').data;

    //drivers.value = getNextBatchOfDrivers({ page: currentPage.value, itemsPerPage: 5, sortBy: 'id' })
    console.log('this is the drivers',drivers.value)
    tableHeaders.value = getTableHeaders(drivers.value);

    console.log('this is the table headers',tableHeaders.value)
    // get count of all drivers using useAsyncData
    const {data:totalItems, pending, error} =  await useAsyncData('awayBusDriversCount', async () => {
        const { data, count,error } = await client.from('awayBusDrivers').select('*',{count:'exact'})
        console.log('total count ',count)
        return count;
    })
    

    /* watchEffect(async () => {
        if (drivers.value) {
            tableHeaders.value = getTableHeaders(drivers.value);
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
                data:key
            }
        })
        return result;
    }


    //const { data, error } = await client.from('awayBusDrivers').select().order('created_at')
</script>

<style>
@import 'datatables.net-dt';
</style>
