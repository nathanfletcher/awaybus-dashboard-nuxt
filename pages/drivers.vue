<template>
    <div>
        <h1>Getting all drivers</h1>
        <v-data-table-server
          :headers="tableHeaders"
          :items="drivers"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          :items-length="driverLength()"
          @update:options="getAllDrivers"
        >
            <template v-slot:item.isVerified="{ item }">
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
            </template>
        </v-data-table-server>


    </div>
</template>
<script setup>
    import { onMounted } from 'vue';
    import { VDataTable, VDataTableServer } from 'vuetify/labs/VDataTable'
    definePageMeta({
        middleware: 'auth'
    })
    const tableHeaders = ref([])
    const client = useSupabaseClient()
    const user = useSupabaseUser()
    const itemsPerPage = ref(10)
    const currentPage = ref(1)
    const totalItems = ref(0)
    const drivers = ref([])
    
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
    

    watchEffect(async () => {
        if (drivers.value) {
            tableHeaders.value = getTableHeaders(drivers.value);
        }
    });

    async function getAllDrivers() {
        return await useAsyncData('awayBusDrivers', async () => {
        const { data } = await client.from('awayBusDrivers').select().order('created_at')
        // console.log(data)
        drivers.value = data;
        return data;
    })
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
