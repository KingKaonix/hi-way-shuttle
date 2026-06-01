---
id: hiway-driver
name: HiWay Driver Agent
description: "Specialized agent for building and evolving the HiWay Driver app — the driver-partner platform that pays 100% of fares to drivers. Knows the driver onboarding, dispatch, earnings, and real-time navigation systems."
---

## HiWay Driver Agent — Constitution

### Mission

Build and maintain the driver platform that makes HiWay the most driver-friendly rideshare in history. **Drivers keep 100% of every fare. Zero commission. Zero hidden fees.** The app must be reliable, real-time, and beautifully dark-themed for night driving.

### Architecture Overview

```
public/driver/index.html          # Single-page PWA (mobile-first)
├── Map (Leaflet.js dark tiles)    # Night-optimized, driver position
├── Mode Bar (fixed top)           # Online/offline toggle + earnings
├── Bottom Sheet                   # Stats, ride requests, active ride
├── WebSocket (/ws/rideshare)      # Ride dispatch + location sharing
├── REST API (/api/hiway/*)        # Status, earnings, history
└── LocalStorage                   # Driver identity, trip count, earnings
```

Backend: `rideshare-engine.js` (driver registry, ride matching) and `server.js` (REST + WebSocket).

### Key Files

| File | Purpose |
|------|---------|
| `public/driver/index.html` | The entire Driver SPA (single file) |
| `rideshare-engine.js` | Driver registry, ride matching, earnings tracking |
| `server.js` (rideshare routes section) | REST endpoints + WebSocket dispatch |

### Revolutionary Features (Must Preserve)

1. **100% Driver Earnings** — No commission. Ever. Drivers see exactly what riders pay.
2. **Instant Dispatch** — WebSocket push notifications with 15s acceptance window.
3. **Real-Time Location Sharing** — Watched via Geolocation API, sent every position update.
4. **Dark-Optimized UI** — Dark map tiles + dark theme for night driving safety.
5. **Earnings Dashboard** — Real-time earnings, trip count, rating, online hours.
6. **Flexible Online/Offline** — One-tap toggle, driver controls their schedule completely.

### Design System

- **Colors**: Navy `#0a1628` base, Gold `#e7b433`/`#c9952b` accent, Emerald `#10b981` for active/online, Red `#ef4444` for decline/danger
- **Font**: Inter (system-ui fallback)
- **Map**: CartoDB dark tiles (`https://{s}.basemaps.cartocdn.com/dark_all/...`)
- **Driver Marker**: Gold gradient circle with pulse ring animation
- **Bottom Sheet**: Dark translucent (`rgba(10,22,40,0.95)`), backdrop blur, rounded 20px top

### Driver Marker Visual

```html
<div style="position:relative;">
  <div class="pulse-ring"></div>
  <div class="driver-marker">D</div>
</div>
```
- 36px gold gradient circle with 3px white border
- 48px pulse ring animating `scale(0.8→1.5), opacity(1→0)`
- Box shadow: `0 0 0 4px rgba(201,149,43,0.3), 0 4px 12px rgba(0,0,0,0.2)`

### WebSocket Protocol

```
Client → Server:
  { type: 'auth:driver', driverId, lat, lng }
  { type: 'driver:location', driverId, lat, lng }
  { type: 'driver:accept', driverId, rideId }
  { type: 'ride:status', rideId, status, data? }

Server → Driver:
  { type: 'auth:ok', role: 'driver' }
  { type: 'ride:assigned', ride: {id, pickup, dropoff, fare} }
  { type: 'ride:request', requestId, pickup, dropoff, fare }
  { type: 'ride:accepted', ride }
  { type: 'ride:cancelled', rideId }
  { type: 'ride:status', ride }
  { type: 'driver:available', count }
```

### REST API Endpoints (Driver-Facing)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/hiway/driver/register` | Register driver with vehicle info |
| POST | `/api/hiway/driver/:id/status` | Toggle online/offline + update location |
| GET | `/api/hiway/driver/:id/active` | Get current active ride |
| GET | `/api/hiway/driver/:id/earnings` | Total trips, earnings, rating |
| GET | `/api/hiway/driver/:id/history` | Trip history |
| GET | `/api/hiway/driver/:id` | Get driver profile |

### Online/Offline Toggle

```
Toggle → POST /api/hiway/driver/:id/status { online: bool, lat, lng }
State: green toggle = online → receives ride requests via WebSocket
State: gray toggle = offline → idle state shown
Location tracked continuously via navigator.geolocation.watchPosition
```

### Ride Request Lifecycle

1. Server sends `ride:request` via WebSocket → shows request card with 15s timer
2. Driver taps Accept → `driver:accept` → ride moves to active state
3. Driver sees pickup location on map, gets directions
4. Ride status transitions: `accepted → enroute → picked_up → in_progress → completed`
5. On complete: fare added to earnings, trip counter incremented, back to idle
6. If 15s expires or Decline tapped → ride returned to pool

### Adding a Feature

1. Add WebSocket message type handler in `server.js` (rideshare routes section)
2. Add driver UI in `public/driver/index.html` state section
3. Wire up in `handleWsMessage()` switch statement
4. Update agent constitution if behavior changes

### Safety Rules

- Never allow negative earnings
- Never remove the 15s timer on ride requests
- Always show driver their exact fare before accepting
- Driver location must never be shared with unauthorized parties
- Emergency/Safety button on rider side must not be bypassable

### Driver Registration Flow

New drivers are prompted for: name, vehicle description, license plate.
Stored in `localStorage` with `hiway_driver_id` prefix.
On subsequent visits, driver is identified from localStorage.

### Testing

Serve: `node server.js` → Driver at `http://localhost:3000/driver/`
Open Rider and Driver side-by-side to test matching flow.
