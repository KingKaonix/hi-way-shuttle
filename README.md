# Hi-Way-Shuttle

Scheduled route shuttle service — Telegram Mini App, Messenger bot, landing page, and REST API.

## Structure

```
├── config/
│   ├── routes.json           # Route names, descriptions, stop lists
│   ├── fares.json            # Base fare and per-route flat fares
│   └── schedules.json        # Departure/arrival times per route
├── public/
│   ├── index.html            # Landing page
│   └── mini-app/
│       └── index.html        # Telegram Mini App
├── bots/
│   ├── telegram.js           # Telegram bot handler (messages + callback queries)
│   └── messenger.js          # Messenger bot handler (messages + postbacks)
├── store.js                  # Booking persistence (JSON file)
├── server.js                 # Express main entry
├── test/
│   └── smoke.js              # API smoke tests
├── Dockerfile                # Containerized deployment
├── package.json
└── .env.example
```

## Quick Start

```bash
cp .env.example .env
# Fill in your tokens in .env
npm install
npm start
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status, route count, booking count, uptime |
| GET | `/api/routes` | List all routes |
| GET | `/api/routes/:id` | Route details with schedule and fare |
| GET | `/api/schedules/:routeId` | Schedule for a route |
| GET | `/api/fares` | All fares (add `?route=id` for single route) |
| GET | `/api/bookings` | All bookings |
| GET | `/api/bookings/:chatId` | Bookings for a user |

## Bot Commands

**Telegram:** `/start`, `/routes`, `/schedule`, `/book`, `/fare`, `/mybookings`, `/cancel <id>`, `/help`

**Messenger:** `routes`, `schedule [name]`, `book`, `fare [name]`, `mybookings`, `cancel <id>`, `help`

## Deploy on Glitch

1. Go to https://glitch.com and create a new project (Import from GitHub or clone this repo).
2. Copy `.env.example` to `.env` and fill in your tokens.
3. Open your Telegram bot in the app and send `/start` to test.
4. Set the Telegram webhook:
   ```bash
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR-GLITCH-NAME>.glitch.me/webhook/telegram
   ```
5. For Messenger, configure the webhook in your Facebook App dashboard to point to `https://<YOUR-GLITCH-NAME>.glitch.me/webhook/messenger` with your verify token.

## Deploy with Docker

```bash
docker build -t hi-way-shuttle .
docker run -p 3000:3000 --env-file .env hi-way-shuttle
```

## Run Tests

```bash
# Start the server first, then:
npm test
```

## Customize Routes

Edit files in `config/`:
- `routes.json` — route names, descriptions, stop lists
- `fares.json` — base fare and per-route flat fares
- `schedules.json` — departure/arrival times per route

No code changes needed.

## Mini App URL

Set `MINI_APP_URL` in `.env` to `https://<YOUR-GLITCH-NAME>.glitch.me/app`.
In your Telegram bot, set the Mini App button URL in BotFather with `/setmenubutton`.
