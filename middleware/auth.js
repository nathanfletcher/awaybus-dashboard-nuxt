export default defineNuxtRouteMiddleware(async (to, from) => {
    const user = useSupabaseUser();
    const client = useSupabaseClient();

    // Allow public access to auth pages
    const publicRoutes = ['/login', '/forgot-password', '/new-password'];
    if (publicRoutes.includes(to.path)) {
        if (user.value) return navigateTo('/');
        return;
    }

    // Require authentication
    if (!user.value) return navigateTo('/login');

    // Fetch user role from awayBusStaff
    let role = 'viewer'; // default: lowest permissions
    try {
        const { data } = await client
            .from('awayBusStaff')
            .select('role')
            .eq('user_table_id', user.value.id)
            .single();
        if (data?.role) role = data.role;
    } catch {
        // Not a staff member — stay as viewer
    }

    // Role hierarchy:
    // superadmin > admin > staff > viewer
    const roleLevels = { superadmin: 4, admin: 3, staff: 2, viewer: 1 };
    const userLevel = roleLevels[role] || 0;

    // Route permission map — each route needs at least the specified role
    const routePermissions = {
        '/staff': 'superadmin',        // only superadmin can manage staff
        '/audit-log': 'admin',          // admin+ can view audit log
        '/drivers': 'staff',            // staff+ can manage drivers
        '/users': 'staff',              // staff+ can manage riders
        '/stops': 'staff',              // staff+ edit stops
        '/routes': 'staff',             // staff+ edit routes
        '/cities': 'admin',             // admin+ manage cities
        '/add-city': 'admin',           // admin+ can add new cities
        '/city-review': 'admin',        // admin+ can review city imports
    };

    // Check route permission
    for (const [path, requiredRole] of Object.entries(routePermissions)) {
        if (to.path.startsWith(path)) {
            const requiredLevel = roleLevels[requiredRole] || 0;
            if (userLevel < requiredLevel) {
                return navigateTo('/'); // redirect to dashboard
            }
            break;
        }
    }

    // Store role for components
    useState('userRole', () => role);
    useState('userStaffId', () => user.value?.id);
});
