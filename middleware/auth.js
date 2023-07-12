export default defineNuxtRouteMiddleware(()=>{
    const user = useSupabaseClient();
    if(!user.value){
        return navigateTo('/login');
    }
})