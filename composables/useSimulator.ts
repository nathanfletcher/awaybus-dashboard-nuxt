// Global driver simulator — state persists across page navigation.
// The simulation loop keeps running until explicitly stopped.

import { ref, reactive } from 'vue'

interface SimDriver {
  id: number
  name: string
  carNumber: string
  _routeOsmId: string
  _routeName: string
  _stops: { id: string; name: string; lat: number; lng: number }[]
  _stopIndex: number
  _totalStops: number
  _moving: boolean
  _color: string
  _lat: number
  _lng: number
}

// Module-level state — survives component unmount / re-mount
const running = ref(false)
const activeDrivers: SimDriver[] = reactive([])
const stats = reactive({ active: 0, ticks: 0, routesUsed: 0, demandCreated: 0, checkInsCreated: 0, checkInsCleared: 0 })
let simTimer: ReturnType<typeof setInterval> | null = null
let anonCounter = 0

// Snapshot of last-used config
const lastDriverCount = ref(5)
const lastRouteFilter = ref<string[]>([])
const lastSpeed = ref('normal')
const lastSimulateDemand = ref(true)

const speedMap: Record<string, number> = { slow: 3000, normal: 1000, fast: 300, ultra: 100 }

// Keep track of which stops have simulated check-ins so we can clean up
const stopCheckInMap = new Map<string, string[]>() // stopId → [user_id, ...]

export function useSimulator() {
  const client = useSupabaseClient()

  // ── Tick ──────────────────────────────────────────────
  async function tick() {
    stats.ticks++

    for (const driver of activeDrivers) {
      const stops = driver._stops
      if (!stops || stops.length === 0) continue

      driver._stopIndex = (driver._stopIndex + 1) % stops.length
      const stop = stops[driver._stopIndex]
      if (!stop) continue

      driver._lat = stop.lat
      driver._lng = stop.lng

      try {
        await client.from('awayBusDrivers').update({
          coordinates: `${stop.lat},${stop.lng}`,
          currentBusStop: String(stop.id),
          busRoute: String(driver._routeOsmId),
          lastActive: new Date().toISOString(),
        }).eq('id', driver.id)
      } catch (_) { /* continue */ }

      if (lastSimulateDemand.value) {
        await simulateStopActivity(stop.id)
      }
    }

    // Periodically sweep stale simulated check-ins (every 10 ticks)
    if (stats.ticks % 10 === 0) {
      await sweepStaleCheckIns()
    }
  }

  // ── Simulate passenger activity at a stop ──────────────
  async function simulateStopActivity(stopId: string) {
    // 1. New passengers arrive (40% chance on any given tick)
    if (Math.random() > 0.6) {
      const arrivals = Math.floor(Math.random() * 8) + 1

      for (let i = 0; i < arrivals; i++) {
        anonCounter++
        const userId = `sim_anon_${String(anonCounter).padStart(6, '0')}`
        try {
          await client.from('passenger_check_ins').insert({
            user_id: userId,
            bus_stop_id: Number(stopId),
            last_seen_at: new Date().toISOString(),
          })
          stats.checkInsCreated++

          // Track for cleanup
          const existing = stopCheckInMap.get(stopId) || []
          existing.push(userId)
          stopCheckInMap.set(stopId, existing)
        } catch (_) { /* skip duplicate user_ids */ }
      }
    }

    // 2. Some passengers board and leave (30% chance)
    const usersHere = stopCheckInMap.get(stopId) || []
    if (usersHere.length > 0 && Math.random() > 0.7) {
      const boarders = Math.min(Math.floor(Math.random() * 5) + 1, usersHere.length)
      const leaving = usersHere.splice(0, boarders)
      stopCheckInMap.set(stopId, usersHere)

      for (const userId of leaving) {
        try {
          await client.from('passenger_check_ins').delete().eq('user_id', userId)
          stats.checkInsCleared++
        } catch (_) { /* continue */ }
      }
    }

    // 3. Update the demand count on the stop
    try {
      const remaining = (stopCheckInMap.get(stopId) || []).length
      await client.from('awayBusStops').update({ no_of_people: remaining }).eq('osm_id', stopId)
      stats.demandCreated++
    } catch (_) { /* continue */ }
  }

  // ── Sweep stale check-ins (simulate pg_cron) ───────────
  async function sweepStaleCheckIns() {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    try {
      const { data: stale } = await client
        .from('passenger_check_ins')
        .select('user_id, bus_stop_id')
        .like('user_id', 'sim_anon_%')
        .lt('last_seen_at', fiveMinAgo)

      if (stale && stale.length > 0) {
        const ids = stale.map((r: any) => r.user_id)
        await client.from('passenger_check_ins').delete().in('user_id', ids)
        stats.checkInsCleared += stale.length

        // Recalculate demand for affected stops
        const affectedStops = new Set(stale.map((r: any) => String(r.bus_stop_id)))
        for (const stopId of affectedStops) {
          const { count } = await client
            .from('passenger_check_ins')
            .select('*', { count: 'exact', head: true })
            .eq('bus_stop_id', stopId)
          await client.from('awayBusStops').update({ no_of_people: count || 0 }).eq('osm_id', stopId)
        }

        // Clean up our tracking map
        for (const stopId of affectedStops) {
          stopCheckInMap.delete(stopId)
        }
      }
    } catch (_) { /* continue */ }
  }

  // ── Start ─────────────────────────────────────────────
  async function start(opts: {
    driverCount: number
    routeFilter: string[]
    speed: string
    simulateDemand: boolean
  }) {
    if (running.value) return

    lastDriverCount.value = opts.driverCount
    lastRouteFilter.value = [...opts.routeFilter]
    lastSpeed.value = opts.speed
    lastSimulateDemand.value = opts.simulateDemand

    // Reset
    stats.active = 0
    stats.ticks = 0
    stats.routesUsed = 0
    stats.demandCreated = 0
    stats.checkInsCreated = 0
    stats.checkInsCleared = 0
    activeDrivers.splice(0, activeDrivers.length)
    anonCounter = 0
    stopCheckInMap.clear()

    // Load drivers
    const { data: drivers } = await client.from('awayBusDrivers').select('*').limit(100)
    if (!drivers || drivers.length === 0) return

    const selected = drivers.slice(0, opts.driverCount)
    if (selected.length === 0) return

    // Load routes & their stop coordinates
    const { data: routes } = await client.from('awayBusRoutes').select('osm_id, name, busStops').limit(100)
    if (!routes) return

    const routeStops: Record<string, { id: string; name: string; lat: number; lng: number }[]> = {}

    for (const route of routes) {
      let stopIds: string[] = []
      try {
        const raw = route.busStops
        if (typeof raw === 'string') {
          if (raw.startsWith('{')) {
            const parsed = JSON.parse(raw)
            stopIds = Array.isArray(parsed?.stops) ? parsed.stops : Array.isArray(parsed) ? parsed : []
          } else {
            stopIds = raw.replace(/[\[\]\"']/g, '').split(',').map((s: string) => s.trim()).filter(Boolean)
          }
        } else if (raw?.stops) {
          stopIds = raw.stops
        } else if (Array.isArray(raw)) {
          stopIds = raw
        }
      } catch (_) { stopIds = [] }

      if (stopIds.length > 0) {
        const { data: stopData } = await client
          .from('awayBusStops')
          .select('osm_id, Name, coordinates')
          .in('osm_id', stopIds.map(String))

        if (stopData) {
          routeStops[route.osm_id] = stopIds
            .map(sid => {
              const s = stopData.find((x: any) => String(x.osm_id) === String(sid))
              if (s?.coordinates) {
                const parts = String(s.coordinates).split(',')
                if (parts.length === 2) {
                  return { id: s.osm_id, name: s.Name || 'Unknown', lat: parseFloat(parts[1]), lng: parseFloat(parts[0]) }
                }
              }
              return null
            })
            .filter(Boolean) as { id: string; name: string; lat: number; lng: number }[]
        }
      }
    }

    // Pick routes
    let available = opts.routeFilter.length > 0
      ? routes.filter(r => opts.routeFilter.includes(r.osm_id))
      : routes.filter(r => (routeStops[r.osm_id]?.length || 0) > 1)

    if (available.length === 0) available = routes.filter(r => (routeStops[r.osm_id]?.length || 0) > 0)
    if (available.length === 0) return

    const colors = ['#008080', '#FFD700', '#E53935', '#7B1FA2', '#1976D2', '#F57C00', '#388E3C', '#C62828', '#00838F', '#6A1B9A']
    const usedRouteIds = new Set<string>()

    for (let i = 0; i < selected.length; i++) {
      const driver = selected[i] as any
      const route = available[Math.floor(Math.random() * available.length)]
      const stops = routeStops[route.osm_id] || []

      driver._routeOsmId = route.osm_id
      driver._routeName = route.name || `Route ${route.osm_id}`
      driver._stops = stops
      driver._stopIndex = 0
      driver._totalStops = stops.length
      driver._moving = true
      driver._color = colors[i % colors.length]

      if (stops.length > 0) {
        driver._lat = stops[0].lat
        driver._lng = stops[0].lng
      }

      await client.from('awayBusDrivers').update({
        busRoute: String(route.osm_id),
        coordinates: stops.length > 0 ? `${stops[0].lat},${stops[0].lng}` : null,
        lastActive: new Date().toISOString(),
      }).eq('id', driver.id)

      activeDrivers.push(driver as SimDriver)
      usedRouteIds.add(route.osm_id)
    }

    stats.active = activeDrivers.length
    stats.routesUsed = usedRouteIds.size

    const interval = speedMap[opts.speed] || 1000
    simTimer = setInterval(tick, interval)
    running.value = true
  }

  // ── Stop ──────────────────────────────────────────────
  async function stop() {
    if (simTimer) {
      clearInterval(simTimer)
      simTimer = null
    }
    running.value = false

    // Mark drivers offline
    for (const driver of activeDrivers) {
      client.from('awayBusDrivers').update({
        isOnline: false,
      }).eq('id', driver.id).catch(() => {})
    }

    // Clean up all simulated check-ins
    try {
      await client.from('passenger_check_ins').delete().like('user_id', 'sim_anon_%')
    } catch (_) { /* ignore */ }

    // Reset demand on affected stops
    for (const [stopId] of stopCheckInMap) {
      client.from('awayBusStops').update({ no_of_people: 0 }).eq('osm_id', stopId).catch(() => {})
    }

    stopCheckInMap.clear()
    activeDrivers.splice(0, activeDrivers.length)
    stats.active = 0
  }

  return {
    running,
    activeDrivers,
    stats,
    lastDriverCount,
    lastRouteFilter,
    lastSpeed,
    lastSimulateDemand,
    speedMap,
    start,
    stop,
  }
}
