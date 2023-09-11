export default defineNuxtRouteMiddleware(async ()=>{
    console.log('middleware')
    const client = useSupabaseClient();
    const user =  await client.auth.getUser();
    console.log(user.data)
    const router = useRouter();
    if(!user.data.user){
        router.push('/login');
    }
})