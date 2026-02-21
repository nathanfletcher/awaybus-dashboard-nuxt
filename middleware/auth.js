export default defineNuxtRouteMiddleware((to, from) => {
    const user = useSupabaseUser();
    
    // Allow public access to auth pages, redirect to home if already logged in
    const publicRoutes = ['/login', '/forgot-password', '/new-password'];
    if (publicRoutes.includes(to.path)) {
        if (user.value) {
            return navigateTo('/');
        }
        return;
    }

    // Protect all other routes
    if (!user.value) {
        return navigateTo('/login');
    }
})