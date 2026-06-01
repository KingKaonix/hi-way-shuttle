# Hi-Way-Shuttle / HiWay Rideshare — Agent Instructions

## Project Overview

Two platforms in one repo:
1. **Hi-Way-Shuttle** — Scheduled shuttle service (Express + React + Telegram bot)
2. **HiWay Rideshare** — Revolutionary on-demand rideshare (Rider + Driver apps)

## Structure

```
├── server.js                 # Express entry — shuttle API + rideshare API + WebSocket
├── rideshare-engine.js       # Nobel-worthy rideshare core (matching, pricing, subs)
├── store.js                  # Booking persistence (JSON file)
├── poller.js                 # Telegram long-polling
├── bots/                     # Telegram + Messenger bots
├── config/                   # Routes, fares, schedules
├── public/
│   ├── index.html            # Landing page (premium navy/gold)
│   ├── rider/                # HiWay Rider SPA (mobile-first PWA)
│   │   └── index.html        #  — the passenger app
│   └── driver/               # HiWay Driver SPA (mobile-first PWA)
│       └── index.html        #  — the driver partner app
├── packages/web/             # React SPA (shuttle bookings)
├── packages/api/             # TypeScript API workspace (future)
├── agents/
│   ├── hiway-rider/SKILL.md  # Rider Agent constitution
│   └── hiway-driver/SKILL.md # Driver Agent constitution
├── data/                     # Persisted bookings (gitignored)
├── test/smoke.js             # API smoke tests
├── Dockerfile                # Containerized deployment
└── fly.toml                  # Fly.io config
```

## Agents

Two specialized agents live in `agents/`:

### HiWay Rider Agent (`agents/hiway-rider/SKILL.md`)
Use when building features for the passenger app. Knows:
- WebSocket protocol for ride matching
- Subscription tiers (Premium/Business/Commuter)
- Zero-surge pricing engine
- Safety anomaly detection system
- Bottom-sheet UI architecture

### HiWay Driver Agent (`agents/hiway-driver/SKILL.md`)
Use when building features for the driver app. Knows:
- 100% driver earnings model
- Real-time location sharing protocol
- Ride dispatch lifecycle (15s accept window)
- Dark-optimized map and UI
- Online/offline state machine

## Running

```bash
npm install
npm start              # Shuttle API on port 3000
# Rider:  http://localhost:3000/rider/
# Driver: http://localhost:3000/driver/
# Shuttle: http://localhost:3000/
```

## Key Revolutionary Principles

- **Zero surge pricing** — fixed rates, subscription discounts instead
- **Drivers keep 100%** — no commission, ever
- **AI-powered matching** — composite score (proximity + rating + demand prediction)
- **Real-time safety** — anomaly detection, share trip, emergency alerts
- **Transparent pricing** — fare breakdown before every ride

## Testing Rideshare

1. Open Rider app (`/rider/`) — set dropoff, request ride
2. Open Driver app (`/driver/`) — go online, accept ride
3. Watch real-time location tracking on the map
4. Complete ride to see earnings update
