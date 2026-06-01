# Config — Agent Instructions

## Overview

Three JSON files drive all routes, fares, and schedules. The server loads them at startup and caches them in memory. Admin API endpoints mutate them and persist via `persistConfig()` in `server.js`.

## routes.json

Array of route objects:
```json
{
  "id": "rt-XX-NN",        // unique route ID (rt-<prefix>-<number>)
  "name": "Route Name",    // human-readable display name
  "stops": ["Stop A", "Stop B"],  // ordered stop list
  "description": "..."     // short description
}
```

- `id` convention: `rt-{abbreviation}-{number}` (e.g., `rt-dw-01`, `rt-ap-02`, `rt-uv-03`).
- Minimum 2 stops per route.

## fares.json

```json
{
  "base_fare": 3.50,
  "per_stop": 1.50,
  "routes": {
    "rt-dw-01": { "flat_fare": 5.00 }
  },
  "currency": "USD"
}
```

- `base_fare` and `per_stop` are reference values (not used in calculations by bots — bots use per-route `flat_fare`).
- Each route ID in `routes` must exist in `routes.json`.
- Currency format: 3-letter ISO code.

## schedules.json

```json
{
  "rt-dw-01": [
    { "departure": "07:00", "arrival": "07:25" }
  ]
}
```

- Keyed by route ID (must match `routes.json`).
- Times in 24h format (`HH:MM`).
- Each entry has `departure` and `arrival`.
- Departure times should be unique within a route.

## Editing

- Edit JSON files directly for static config changes (restart server to reload).
- Or use Admin API endpoints (`POST/PUT/DELETE /api/admin/routes/*`) with `X-API-Key` header.
- Admin API changes persist automatically to disk.
- Bot modules load config independently from `server.js` — if editing files directly, restart the server.
