# Station Master Dashboard Plan

## Objective
Provide administrators with a robust, web-based tool to manage the transit network's master data (Stops, Routes, Drivers, Users) using Nuxt 3 and Vuetify.

## Tasks
1. **Data Fetching Fixes:**
   - The current implementation uses DataTables.net within Vue components. The usage of `useAsyncData` and `useFetch` was noted as incorrect or causing missing network activity.
   - Refactor the data fetching in `DataTableJs.vue` to properly leverage Nuxt 3's isomorphic fetching (`useAsyncData` with the `@nuxtjs/supabase` client) so data loads correctly on the server and hydrates on the client without double-fetching or hanging.

2. **Authentication Middleware:**
   - Ensure `middleware/auth.js` securely protects all routes except `/login` and `/forgot-password`. 
   - Confirm that expiring sessions correctly redirect users back to the login page.

3. **Data Integrity & UI Polish:**
   - Ensure the JSON fields in `awayBusRoutes` (specifically the `busStops` array) can be viewed and edited without breaking the application.
   - Add basic form validation to the "Add" and "Edit" dialogs in `DataTableJs.vue` to prevent saving empty strings or null values where they are not permitted.

---

### Prompt for Coding Agent
```text
You are an expert Vue 3 and Nuxt 3 Developer. Your task is to stabilize the Station Master Dashboard located in the `awaybus-dashboard-nuxt` directory.

1. Focus on `components/DataTableJs.vue`. The current data fetching mechanism using `useAsyncData` with the Supabase client is causing issues with SSR hydration and reactivity. Refactor it to cleanly fetch the initial dataset, pass it to the DataTables instance, and ensure the UI reflects changes when `createSupabaseRow`, `editSupabaseRow`, and `deleteSupabaseRows` are executed.
2. Ensure the Vue reactivity system plays nicely with the vanilla JS DataTables library (e.g., using `markRaw` for the DataTables instance if necessary to prevent Vue from deeply proxying the complex DataTables object).
3. Review `middleware/auth.js`. Ensure it properly uses Nuxt 3's `navigateTo` instead of direct router pushes, and that it correctly handles both server-side and client-side auth checks using `@nuxtjs/supabase`.
```