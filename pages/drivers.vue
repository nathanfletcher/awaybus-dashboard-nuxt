<template>
    <div>
        <h1>Getting all drivers</h1>
        <v-data-table-server
          :headers="tableHeaders"
          :items="drivers"
          :items-per-page="itemsPerPage"
          :items-length="totalItems"
          :loading="loading"
          :item-value="drivers"
          :page="currentPage"
          @update:options="getAllDrivers"
        >
        <template v-slot:item.created_at>
            <p>{{  date.format('2023-01-04T23:05:06.299989+00:00', 'normalDateWithWeekday') }}</p>
        </template>
        <template v-slot:item.lastActive>
            <p>{{ date.format('2023-01-04T23:05:06.299989+00:00', 'normalDateWithWeekday') }}</p>
        </template>
            <!--<template v-slot:item.isVerified="{ item }">
                <v-chip
                :color="item.isVerified ? 'green' : 'red'"
                dark
                small
                >
                {{ item.isVerified ? 'Verified' : 'Not Verified' }}
                </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
                <v-icon
                small
                class="mr-2"
                @click="editItem(item)"
                >
                mdi-pencil
                </v-icon>
                <v-icon
                small
                @click="deleteItem(item)"
                >
                mdi-delete
                </v-icon>
            </template>
             <template v-slot:no-data>
                <v-btn
                color="primary"
                @click="initialize"
                >
                Reset
                </v-btn>
            </template> -->
            <template v-slot:bottom>
                <v-pagination v-model="itemsPerPage" @update:model-value="currentPage = parseInt($event, +10)"></v-pagination>
            </template>
        </v-data-table-server>


    </div>
</template>
<script setup>
    import { onMounted } from 'vue';
    import { useDate } from 'vuetify/labs/date'
    import { VDataTable, VDataTableServer } from 'vuetify/labs/VDataTable'
    definePageMeta({
        middleware: 'auth'
    })
    const date = useDate()
    const tableHeaders = ref([])
    const client = useSupabaseClient()
    const user = useSupabaseUser()
    const itemsPerPage = ref(5)
    const currentPage = ref(1)
    //const totalItems = ref(0)
    const drivers = ref([])
    const loading = ref(false)
    
    // const { data:drivers, error } = await useAsyncData('drivers', async () => {
    //     return await client.from('awayBusDrivers').select().order('created_at')
    // })

    // get all drivers using useAsyncData
    /* const {data:drivers, pending, error} =  await useAsyncData('awayBusDrivers', async () => {
        const { data } = await client.from('awayBusDrivers').select().order('created_at')
        console.log(data)
        return data;
    }) */
    //drivers.value = await client.from('awayBusDrivers').select().order('created_at').data;

    // get count of all drivers using useAsyncData
    const {data:totalItems, pending, error} =  await useAsyncData('awayBusDriversCount', async () => {
        const { data, count,error } = await client.from('awayBusDrivers').select('*',{count:'exact'})
        console.log('total count ',count)
        return count;
    })
    

    watchEffect(async () => {
        if (drivers.value) {
            tableHeaders.value = getTableHeaders(drivers.value);
        }
    });

    async function getAllDrivers() {
        console.log('this is page', currentPage.value) 
        loading.value = true;
        let result =  await useAsyncData('awayBusDrivers', async () => {
            const { data } = await client.from('awayBusDrivers').select().range(currentPage.value-1,(currentPage.value ) * itemsPerPage.value)//.range(currentPage.value, currentPage.value+itemsPerPage.value)//.limit(itemsPerPage.value).range((currentPage.value - 1) * itemsPerPage.value).order('created_at', { ascending: false })
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
                title: key,
                align: 'start',
                sortable: true,
                key: key,
            }
        })
        console.log("Table headers")
        console.log(result)
        return result;
    }


    //const { data, error } = await client.from('awayBusDrivers').select().order('created_at')
</script>
