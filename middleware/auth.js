export default defineNuxtRouteMiddleware(()=>{
    const user = useSupabaseClient();
    const router = useRouter();
    if(!user){
        router.push('/login');
    }
})