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
│   └── smoke.js              # API smoke tests (25 tests)
├── .github/workflows/ci.yml  # GitHub Actions CI
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

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status, route count, booking count, uptime |
| GET | `/api/routes` | List all routes |
| GET | `/api/routes/:id` | Route details with schedule and fare |
| GET | `/api/schedules/:routeId` | Schedule for a route |
| GET | `/api/fares` | All fares (add `?route=id` for single route) |
| GET | `/api/bookings` | All bookings |
| GET | `/api/bookings/:chatId` | Bookings for a user |

### Admin (requires `X-API-Key` header or `?api_key=` query)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/routes` | Add a new route |
| PUT | `/api/admin/routes/:id` | Update a route |
| DELETE | `/api/admin/routes/:id` | Delete a route |
| PUT | `/api/admin/fares/:routeId` | Update fares for a route |
| PUT | `/api/admin/schedules/:routeId` | Replace schedule for a route |

## Bot Commands

**Telegram:** `/start`, `/routes`, `/schedule`, `/book`, `/fare`, `/mybookings`, `/cancel <id>`, `/help`

**Messenger:** `routes`, `schedule [name]`, `book`, `fare [name]`, `mybookings`, `cancel <id>`, `help`

## Deploy on Glitch

1. Go to https://glitch.com and create a new project (Import from GitHub or clone this repo).
2. Copy `.env.example` to `.env` and fill in your tokens.
3. Open your Telegram bot in the app and send `/start` to test.
4. Set the Telegram webhook:
   ```bash
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR-GLITCH-NAME>.glitch.me/webhook/telegram&secret_token=<YOUR_SECRET>
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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token |
| `TELEGRAM_WEBHOOK_SECRET` | No | Secret token to validate webhook origin |
| `MESSENGER_VERIFY_TOKEN` | No | Messenger webhook verify token |
| `MESSENGER_PAGE_TOKEN` | No | Messenger page access token |
| `ADMIN_API_KEY` | No | API key for admin CRUD endpoints |
| `MINI_APP_URL` | No | URL for the Telegram Mini App |

## Customize Routes

Edit files in `config/` or use the admin API endpoints.

No code changes needed.

## Mini App URL

Set `MINI_APP_URL` in `.env` to `https://<YOUR-GLITCH-NAME>.glitch.me/app`.
In your Telegram bot, set the Mini App button URL in BotFather with `/setmenubutton`.
