# Hi-Way-Shuttle — Agent Instructions

## Project Overview

Node.js/Express shuttle service with Telegram bot, Messenger bot, and a Telegram Mini App. Bookings are persisted to a JSON file. Config is driven by JSON files under `config/`.

## Structure

```
├── bots/
│   ├── telegram.js      # Telegram bot — inline keyboards, callback queries
│   └── messenger.js     # Messenger bot — quick replies, postbacks
├── config/
│   ├── fares.json       # Base fare + per-route flat fares + currency
│   ├── routes.json      # Route definitions with stops
│   └── schedules.json   # Departure/arrival times per route
├── public/
│   ├── index.html       # Landing page (fetches API data)
│   └── mini-app/
│       └── index.html   # Telegram Mini App (standalone booking UI)
├── data/
│   └── bookings.json    # Persisted bookings (gitignored)
├── server.js            # Express entry point, API routes, webhooks
├── store.js             # Booking CRUD (JSON file persistence)
├── poller.js            # Telegram long-polling loop
├── test/
│   └── smoke.js         # 25 API smoke tests
├── AGENTS.md
└── package.json
```

## Conventions

- **Style**: CommonJS (`require`/`module.exports`), no async IIFE at top level.
- **Error handling**: All async handlers wrapped in try/catch that logs and swallows errors — never let a webhook or poller crash.
- **Bot modules**: Factory functions (`createTelegramBot`, `createMessengerBot`) that receive dependencies (data accessors, booking ID ref) as parameters — no global state.
- **Booking ID**: Managed via `bookingIdRef` (a mutable ref object with `value` property) passed from `server.js` to bot modules.
- **Config**: Loaded at module scope in bot files (re-read on server restart). Admin CRUD in `server.js` persists via `persistConfig()`.
- **API**: Public endpoints under `/api/`, admin under `/api/admin/` (requires `X-API-Key` header or `?api_key=` query param).
- **HTTP status codes**: 200 success, 201 created, 400 bad request, 401 unauthorized, 404 not found, 409 conflict, 503 service unavailable.

## Running

```bash
cp .env.example .env   # fill in TELEGRAM_BOT_TOKEN at minimum
npm install
npm start              # starts on port 3000
```

## Testing

```bash
npm test               # starts server, runs smoke tests, kills server
```

The smoke test (`test/smoke.js`) uses Node's built-in `http` module — no test framework dependency.

## Bot Patterns

- **Telegram**: Handles `message` and `callback_query` updates. Callback data format: `action_routeId` or `action_routeId_index`. Navigation via inline keyboards.
- **Messenger**: Handles text messages and postbacks. Quick replies for route selection. Booking confirmation uses `messengerId` field.
- Both bots load config JSON at module scope independently of `server.js`.

## Adding a Feature

1. Add API route in `server.js` if needed.
2. Wire up store/bot functions.
3. Update the bot handler(s) in `bots/`.
4. Add test assertions in `test/smoke.js`.
5. Restart server to pick up config changes (configs are cached in memory).

## Mini App

The Mini App (`public/mini-app/index.html`) is a standalone SPA. Currently does **not** persist bookings to the server — it simulates confirmation client-side. No auth integration.
