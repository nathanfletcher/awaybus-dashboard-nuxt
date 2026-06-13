# Station Master Dashboard — Development Plan

## Product Context: Managing Ghana's Transit Network

The AwayBus dashboard is the control center. Station masters, transit authority staff, and eventually vehicle union leaders use it to manage the network: add new stops, define routes, verify drivers, monitor demand, and respond to incidents. In Ghana, trotro routes change organically — new stops appear, roads are repaired, traffic patterns shift. The dashboard must be flexible enough to keep up.

**Admin realities:**
- Most station masters are not technical — the UI must be intuitive, forgiving, and hard to break
- Internet at stations is unreliable — PWA offline support is critical
- Data accuracy matters for trust — if the map shows a stop in the wrong place, drivers won't use the app
- Route management is the most complex workflow — expect non-technical users to build routes via the map

## Current State Assessment

**What works:**
- Full CRUD for stops, routes, drivers, users via `NativeDataTable`
- Interactive Leaflet maps for stop placement (click/drag marker)
- Route builder with visual polyline and stop reordering
- Supabase Auth with route protection middleware
- PWA-enabled with offline fallback page
- SSR via Nuxt 3
- Realtime subscription on dashboard for live demand counts

**Critical gaps (blocking production):**
1. **RLS is effectively disabled** — all policies are `USING (true) WITH CHECK (true)`. Anyone with an anon key can read/write all tables, including driver phone numbers. This is a data breach waiting to happen.
2. **Foreign keys point to legacy table** — `awayBusDrivers.busRoute` and `awayBusRiders.busRoute` reference `awayBusRoutes_old(id)`, not the active `awayBusRoutes(osm_id)`. Data integrity is broken.
3. **Three orphaned route tables** — `awayBusRoutes_old`, `awayBusRoutes_old2`, `awayBusRoutes_old_jsonb_bus_stop`. No migration path, confusing to maintainers.
4. **No role-based access control** — any authenticated user gets full admin CRUD. No distinction between read-only viewer, station staff, and super admin.
5. **Edit operations use `upsert` not `update`** — if a primary key field is accidentally cleared in the form, upsert creates a new row instead of updating. Data corruption risk.
6. **No staff management page** — `awayBusStaff` table exists but has no dashboard page.
7. **Duplicate/misspelled RPCs** — `increament_bus_stop_population` vs `increase_bus_stop_population`.

## Priority Tasks

### Phase 1: Security Hardening (P0 — Critical)

**Task 1.1: Implement proper RLS policies**
- `awayBusStops`: Public read, admin-only write (check `auth.uid()` against `awayBusStaff` with `role = 'admin'`).
- `awayBusRoutes`: Same as stops.
- `awayBusDrivers`: Public read of non-sensitive fields (name, currentBusStop, coordinates). Phone numbers and car numbers restricted to admin + the driver themselves.
- `awayBusRiders`: Admin-only read/write.
- `awayBusStaff`: Admin-only read/write. Staff can read their own record.
- `passenger_check_ins`: The existing owner-only policy is correct. Verify it's enforced.

**Task 1.2: Add role-based access control to dashboard**
- Add a `role` column to `awayBusStaff` with enum: `admin`, `staff`, `viewer`.
- Middleware checks `user_metadata.role` from Supabase Auth JWT.
- `viewer`: read-only access to all pages.
- `staff`: CRUD on stops, routes, drivers (but not staff management).
- `admin`: full access including staff management and system settings.
- Update `middleware/auth.js` to check roles and redirect unauthorized users.

**Task 1.3: Add staff management page**
- New page: `/staff` — CRUD on `awayBusStaff`.
- Fields: first name, last name, email, phone, role (dropdown), station assignment.
- Link from the sidebar navigation.
- Only visible to `admin` role.

**Task 1.4: Fix `upsert` → `update` in NativeDataTable**
- In `NativeDataTable.vue`, the `editSupabaseRow` method uses `.upsert()`. Change to `.update()` with a proper `.eq('id', rowId)` filter.
- Add confirmation before edit save: "Are you sure you want to update [Stop Name]?"

### Phase 2: Data Integrity (P0)

**Task 2.1: Migrate foreign keys to the active route table**
- Update `awayBusDrivers.busRoute` FK to reference `awayBusRoutes(osm_id)`.
- Update `awayBusRiders.busRoute` FK to reference `awayBusRoutes(osm_id)`.
- This requires a migration with data verification — ensure all referenced route IDs exist in `awayBusRoutes`.

**Task 2.2: Clean up orphaned tables**
- Drop `awayBusRoutes_old`, `awayBusRoutes_old2`, `awayBusRoutes_old_jsonb_bus_stop` after verifying no code references them.
- Consolidate any useful data from old tables into `awayBusRoutes` before dropping.

**Task 2.3: Consolidate duplicate RPCs**
- Delete `increament_bus_stop_population` (misspelled, unused if heartbeat system is the source of truth).
- Keep `increase_bus_stop_population` only if it's still needed by legacy code. Otherwise delete both and rely solely on the `passenger_heartbeat` trigger system.

**Task 2.4: Add form validation to NativeDataTable**
- Required field validation: stop name, coordinates, route name cannot be empty.
- Type validation: coordinates must match `lng,lat` pattern, numeric fields must be numbers.
- FK fields (like driver's route) should be dropdown selectors, not free text.
- Show validation errors inline, not just a generic toast.

### Phase 3: Dashboard & Monitoring (P1)

**Task 3.1: Incident management**
- New page: `/incidents` — log and track issues (driver reported breakdown, stop inaccessible, route detour).
- Incident types: `breakdown`, `accident`, `road_closure`, `stop_issue`, `other`.
- Status workflow: `reported → acknowledged → in_progress → resolved`.
- Linked to driver and route.
- Push notification to affected passengers (via edge function).

**Task 3.2: Demand analytics**
- New section on dashboard: demand over time (line chart: people waiting per hour, per day).
- Heatmap: which stops have highest demand by time of day.
- Route performance: average passenger count per trip, average trip duration.
- Use Supabase Realtime for live data, historical queries for charts.

**Task 3.3: Driver monitoring**
- Real-time map showing all active drivers (from `awayBusDrivers` where `isOnline = true`).
- Click a driver marker → see name, car number, route, current stop, time since last update.
- Stale driver detection: highlight drivers who haven't updated location in >60 seconds (amber) or >5 minutes (red).

**Task 3.4: Search & filter enhancements**
- Global search across all entities (stops, routes, drivers, riders).
- Filter drivers by: online status, verification status, route.
- Filter stops by: route membership, demand level.
- Export filtered data as CSV.

### Phase 4: UI/UX Improvements (P2)

**Task 4.1: NativeDataTable refactoring**
- Extract Leaflet map logic into a separate `MapPicker.vue` component (currently 200+ lines of map logic embedded in the 760-line table).
- Extract the route builder into `RouteBuilder.vue`.
- Reduce `NativeDataTable.vue` to data-fetching + table rendering + action dispatching.

**Task 4.2: Offline-first PWA**
- Cache the full stop list and route list in IndexedDB via Workbox.
- Allow viewing cached data when offline (read-only).
- Queue mutations (create/edit/delete) for sync when reconnected.
- The PWA config is already set up — just needs the service worker caching strategy.

**Task 4.3: Mobile-responsive table**
- `v-data-table` doesn't work well on mobile. Add a card-based mobile view for stops/routes/drivers.
- Detect viewport and switch between table and card layout.

**Task 4.4: Audit log**
- Log all admin actions: who created/edited/deleted what and when.
- New `audit_log` table: `id`, `staff_id`, `action`, `table_name`, `row_id`, `old_values` (JSONB), `new_values` (JSONB), `created_at`.
- Add a read-only `/audit-log` page (admin only).

### Phase 5: Multi-City Management (P1 — Digital Public Good)

> **Context:** AwayBus must be deployable in any city. The dashboard is where new cities are onboarded — from OSM data import to review to publishing. A non-technical station master should be able to add their city.

**Task 5.1: City management page (`/cities`)**
- New sidebar nav item: "Cities".
- List all cities with: name, country, status (active/inactive/pending), stop count, route count, last import date.
- Actions per city: Activate/Deactivate, Re-import OSM data, View on map, Delete.
- "Add City" button opens the city onboarding wizard.

**Task 5.2: City onboarding wizard**
- **Step 1 — City Info:** Name, country (searchable dropdown), region, country code.
- **Step 2 — Define area:** Full-screen Leaflet map. Admin draws a rectangle (bounding box) or searches for a city name to auto-fit the OSM boundary.
  - Alternatively: enter an OSM relation ID for the city boundary (e.g., Accra's relation is `25504410`).
  - The map shows existing OSM bus stops as small dots to give a sense of data density before importing.
- **Step 3 — Preview OSM data:** Calls the `osm-import` Edge Function. Shows a loading progress bar while fetching. Displays summary: "Found X bus stops and Y bus routes."
- **Step 4 — Review & publish:**
  - Interactive map showing all imported stops (color-coded: new=blue, existing=green, flagged=orange).
  - Table below map listing stops with key fields (name, coordinates, OSM tags).
  - Table listing routes with name, from→to, stop count.
  - Bulk actions: "Approve All", "Delete Selected", "Merge Duplicates" (for stops within ~50m of each other).
  - "Publish" button makes the city live.

**Task 5.3: City-scoped data filtering**
- Add a city selector dropdown to the app header (visible on all pages).
- Selecting a city filters all data tables (stops, routes, drivers, users) to that city.
- Dashboard overview (`index.vue`) shows city-specific metrics.
- The selected city is stored in localStorage and persists across sessions.

**Task 5.4: NativeDataTable city-aware rendering**
- The table automatically adds city-based filtering when `city_id` is present.
- Route builder modal: only shows stops from the currently selected city.
- Driver table: shows which city each driver's route belongs to.
- Import/export: scoped to the selected city.

**Task 5.5: Import review workflow**
- New page: `/cities/:id/review` — detailed review of pending imports.
- Side-by-side diff view for incremental updates: "2 stops added, 1 route modified, 0 deleted."
- Map overlay showing old vs new data.
- Approve/reject individual changes or all at once.
- Import history log at the bottom showing past imports with timestamps and statistics.

**Task 5.6: Self-serve deployment guide**
- A "Deploy AwayBus" help section accessible from the dashboard.
- Step-by-step guide for a new city administrator:
  1. Sign up for an AwayBus account
  2. Add your city and define its area
  3. Import OSM data or upload a CSV
  4. Review and correct stop positions on the map
  5. Define or import routes (connect stops)
  6. Invite drivers and staff
  7. Publish your city — it's live
- Links to documentation, video tutorials, and community forum.
- Downloadable "City Data Package" for sharing with other AwayBus deployments.

### Phase 6: Post-Launch (P3)

- **Bulk import/export** — import routes/stops from CSV or GTFS (General Transit Feed Specification)
- **Scheduled reports** — daily/weekly email reports of network activity to station masters
- **Multi-station support** — partition data by station/region for larger deployments
- **API keys for third-party integrations** — allow transit authorities to access data programmatically
- **Vehicle owner portal** — separate login for vehicle owners to see their fleet's performance
