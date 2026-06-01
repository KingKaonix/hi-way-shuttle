# Bots — Agent Instructions

## Overview

Two bot modules: `telegram.js` and `messenger.js`. Both use factory functions (`createTelegramBot` / `createMessengerBot`) that receive dependencies as parameters.

## Telegram Bot (`telegram.js`)

- **Updates**: Handles `message` and `callback_query` types.
- **Callback data format**: `action_RouteId` or `action_RouteId_index` (e.g., `schedule_rt-dw-01`, `confirm_rt-ap-02_3`).
- **Keyboard patterns**: Use `inline_keyboard` for route selection and time slot selection.
- **Booking confirmation**: After user selects a slot via callback, creates booking via `addBooking()` and increments `bookingIdRef.value`.
- **Markdown**: All messages use `parse_mode: Markdown` with `*bold*` syntax.
- **Config**: Loads `routes.json`, `fares.json`, `schedules.json` at module scope — restart server to pick up changes.
- **Error handling**: Wrap all async handlers in try/catch logging the error — never crash the webhook.
- **Commands**: `/start`, `/routes`, `/schedule [id]`, `/book`, `/fare [id]`, `/mybookings`, `/cancel <id>`, `/help`.

## Messenger Bot (`messenger.js`)

- **Messages**: Text-based command matching (lowercased). Substring matching on route names is fragile — prefer exact match when possible.
- **Postbacks**: Route selection via postback payloads (`book_RouteId`, `confirm_RouteId_index`).
- **Quick replies**: Used instead of inline keyboards (Meta API limitation). Max 6 quick replies per message.
- **Booking ownership**: Checked via `booking.messengerId` field.
- **Fare display**: Not shown on booking confirmation (unlike Telegram) — add if parity is needed.
- **Commands**: `routes`, `schedule [name]`, `book`, `fare [name]`, `mybookings`, `cancel <id>`, `help`.

## Common Patterns

- Both bots use `axios` to call their respective platform APIs.
- `bookingIdRef` is a mutable ref object `{ value: number }` shared from `server.js`.
- Always `await` platform API calls inside handlers.
- Booking objects have shape: `{ id, route, departure, arrival, chatId? | messengerId?, status, createdAt }`.
