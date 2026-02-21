# Station Master Dashboard Plan

## Objective
Provide administrators with a robust, web-based tool to manage the transit network's master data (Stops, Routes, Drivers, Users) using Nuxt 3 and Vuetify.

## Tasks
1. **[DONE] Data Fetching Fixes:**
   - The current implementation uses DataTables.net within Vue components. The usage of `useAsyncData` and `useFetch` was noted as incorrect or causing missing network activity.
   - Refactor the data fetching in `DataTableJs.vue` to properly leverage Nuxt 3's isomorphic fetching (`useAsyncData` with the `@nuxtjs/supabase` client) so data loads correctly on the server and hydrates on the client without double-fetching or hanging.

2. **[DONE] Authentication Middleware:**
   - Ensure `middleware/auth.js` securely protects all routes except `/login` and `/forgot-password`. 
   - Confirm that expiring sessions correctly redirect users back to the login page.

3. **[DONE] Data Integrity & UI Polish:**
   - Ensure the JSON fields in `awayBusRoutes` (specifically the `busStops` array) can be viewed and edited without breaking the application.
   - Add basic form validation to the "Add" and "Edit" dialogs in `DataTableJs.vue` to prevent saving empty strings or null values where they are not permitted.

4. **[DONE] Interactive Route Builder & Map:**
   - Instead of manually typing JSON IDs, implemented a "Route Builder" modal.
   - Administrators can search for stops and add them to a route in a specific order (using up/down buttons).
   - Integrated **Leaflet** to render a live map in the center of the modal. As stops are added or reordered, the map dynamically plots markers (start = green, end = red, middle = blue) and draws a polyline connecting the route for visual confirmation.

5. **[DONE] Interactive Bus Stop Editor:**
   - Integrated an interactive Leaflet map directly into the "Add Bus Stop" and "Edit Bus Stop" dialogs.
   - Administrators can visually verify the location of a stop.
   - Clicking on the map or dragging the marker automatically populates the `coordinates` text field with precise latitude and longitude.
   - Conversely, typing coordinates into the text field instantly updates the marker position on the map.

6. **[DONE] Driver Management Enhancements:**
   - Add a one-click "Verify Driver" button to the Drivers table to streamline the registration approval process.
   - Display a human-readable status for verification instead of just true/false.

---

### Prompt for Coding Agent
```text
You are an expert Vue 3 and Nuxt 3 Developer. Your task is to stabilize the Station Master Dashboard located in the `awaybus-dashboard-nuxt` directory.

1. Focus on `components/DataTableJs.vue`. The current data fetching mechanism using `useAsyncData` with the Supabase client is causing issues with SSR hydration and reactivity. Refactor it to cleanly fetch the initial dataset, pass it to the DataTables instance, and ensure the UI reflects changes when `createSupabaseRow`, `editSupabaseRow`, and `deleteSupabaseRows` are executed.
2. Ensure the Vue reactivity system plays nicely with the vanilla JS DataTables library (e.g., using `markRaw` for the DataTables instance if necessary to prevent Vue from deeply proxying the complex DataTables object).
3. Review `middleware/auth.js`. Ensure it properly uses Nuxt 3's `navigateTo` instead of direct router pushes, and that it correctly handles both server-side and client-side auth checks using `@nuxtjs/supabase`.
```