require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { createTelegramBot } = require('./bots/telegram');
const { createMessengerBot } = require('./bots/messenger');
const { getBookings, addBooking, cancelBooking, loadBookings, saveBookings } = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Validate required env vars ---
const REQUIRED_ENV = ['TELEGRAM_BOT_TOKEN'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Load config ---
const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'routes.json'), 'utf8'));
const fares = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'fares.json'), 'utf8'));
const schedules = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'schedules.json'), 'utf8'));

// --- Load persisted bookings ---
loadBookings();
let bookingIdCounter = getBookings().reduce((max, b) => Math.max(max, b.id || 0), 0) + 1;

const bookingIdRef = {
  get value() { return bookingIdCounter; },
  set value(v) { bookingIdCounter = v; }
};

// --- Init bot modules ---
const telegramBot = createTelegramBot(
  process.env.TELEGRAM_BOT_TOKEN,
  getBookings, addBooking, cancelBooking, bookingIdRef
);

const messengerBot = createMessengerBot(
  process.env.MESSENGER_PAGE_TOKEN,
  getBookings, addBooking, cancelBooking, bookingIdRef
);

// --- API Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/routes', (req, res) => {
  res.json(routes);
});

app.get('/api/routes/:id', (req, res) => {
  const route = routes.find(r => r.id === req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  const schedule = schedules[req.params.id] || [];
  const fare = fares.routes[req.params.id] || { flat_fare: fares.base_fare };
  res.json({ ...route, schedule, fare });
});

app.get('/api/schedules/:routeId', (req, res) => {
  const schedule = schedules[req.params.routeId];
  if (!schedule) return res.status(404).json({ error: 'Route not found' });
  res.json(schedule);
});

app.get('/api/fares', (req, res) => {
  const routeId = req.query.route;
  if (routeId) {
    const routeFare = fares.routes[routeId];
    if (!routeFare) return res.status(404).json({ error: 'Route not found' });
    return res.json(routeFare);
  }
  res.json(fares);
});

// --- Webhooks ---
app.post('/webhook/telegram', async (req, res) => {
  try {
    const update = req.body;
    if (!update) return res.sendStatus(200);
    if (!update.message && !update.callback_query) return res.sendStatus(200);

    const miniAppUrlFallback = `https://${req.hostname}/app`;
    await telegramBot.handleUpdate(update, miniAppUrlFallback);
  } catch (err) {
    console.error('Telegram webhook error:', err.message);
  }
  res.sendStatus(200);
});

app.get('/webhook/messenger', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.MESSENGER_VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

app.post('/webhook/messenger', async (req, res) => {
  try {
    const body = req.body;
    if (!body || body.object !== 'page') return res.sendStatus(200);

    await Promise.all(body.entry.flatMap(entry =>
      (entry.messaging || []).map(async (event) => {
        try {
          if (event.message && event.message.text) {
            await messengerBot.handleMessage(event.sender.id, event.message.text);
          } else if (event.postback) {
            await messengerBot.handlePostback(event.sender.id, event.postback.payload);
          }
        } catch (err) {
          console.error('Messenger event error:', err.message);
        }
      })
    ));
  } catch (err) {
    console.error('Messenger webhook error:', err.message);
  }
  res.status(200).send('EVENT_RECEIVED');
});

// --- Booking API ---
app.get('/api/bookings', (req, res) => {
  res.json(getBookings());
});

app.get('/api/bookings/:chatId', (req, res) => {
  const userBookings = getBookings().filter(b =>
    b.chatId == req.params.chatId || b.messengerId === req.params.chatId
  );
  res.json(userBookings);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    routes: routes.length,
    bookings: getBookings().length,
    uptime: process.uptime()
  });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Hi-Way-Shuttle running on port ${PORT}`);
});
