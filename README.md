# Hi-Way-Shuttle

Scheduled route shuttle service — Telegram Mini App, Messenger bot, and landing page.

## Deploy on Glitch

1. Go to https://glitch.com and create a new project (Import from GitHub or clone this repo).
2. Copy `.env.example` to `.env` and fill in your tokens.
3. Open your Telegram bot in the app and send `/start` to test.
4. Set the Telegram webhook:
   ```bash
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR-GLITCH-NAME>.glitch.me/webhook/telegram
   ```
5. For Messenger, configure the webhook in your Facebook App dashboard to point to `https://<YOUR-GLITCH-NAME>.glitch.me/webhook/messenger` with your verify token.

## Customize Routes

Edit files in `config/`:
- `routes.json` — route names, descriptions, stop lists
- `fares.json` — base fare and per-route flat fares
- `schedules.json` — departure/arrival times per route

No code changes needed.

## Structure

```
├── config/
│   ├── routes.json
│   ├── fares.json
│   └── schedules.json
├── public/
│   ├── index.html          # Landing page
│   └── mini-app/
│       └── index.html      # Telegram Mini App
├── bots/
│   ├── telegram.js         # Telegram bot handler (messages + callback queries)
│   └── messenger.js        # Messenger bot handler (messages + postbacks)
├── server.js               # Express main entry
├── package.json
└── .env.example
```

## Commands

**Telegram Bot:** `/start`, `/routes`, `/book`, `/schedule [route]`, `/fare [route]`, `/help`

**Messenger Bot:** `routes`, `book`, `schedule [name]`, `help`

## Mini App URL

Set `MINI_APP_URL` in `.env` to `https://<YOUR-GLITCH-NAME>.glitch.me/app`.
In your Telegram bot, set the Mini App button URL in BotFather with `/setmenubutton`.
