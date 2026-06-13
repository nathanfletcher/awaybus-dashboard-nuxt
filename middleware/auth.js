export default defineNuxtRouteMiddleware(async (to, from) => {
    const user = useSupabaseUser();
    const client = useSupabaseClient();
    
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

    // Fetch user role from awayBusStaff (cached in session)
    const { data: staffRecord } = await client
        .from('awayBusStaff')
        .select('role')
        .eq('user_table_id', user.value.id)
        .single();

    const role = staffRecord?.role || 'staff';

    // RBAC: restrict access based on role
    const adminOnlyRoutes = ['/staff', '/audit-log'];
    const staffRoutes = ['/stops', '/routes', '/drivers', '/users'];

    if (adminOnlyRoutes.includes(to.path) && role !== 'admin') {
        return navigateTo('/');
    }

    // Viewer can only view the dashboard overview
    if (role === 'viewer' && !['/', '/stops', '/routes'].includes(to.path)) {
        return navigateTo('/');
    }

    // Store role for use in components
    useState('userRole', () => role);
})
