require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { createTelegramBot } = require('./bots/telegram');
const { createMessengerBot } = require('./bots/messenger');
const { getBookings, addBooking, cancelBooking, loadBookings, saveBookings } = require('./store');

// --- Validate required env vars ---
const REQUIRED_ENV = ['TELEGRAM_BOT_TOKEN'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_API_KEY || '';
const TELEGRAM_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Load config ---
let routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'routes.json'), 'utf8'));
let fares = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'fares.json'), 'utf8'));
let schedules = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'schedules.json'), 'utf8'));

// --- Load persisted bookings ---
loadBookings();
let bookingIdCounter = getBookings().reduce((max, b) => Math.max(max, b.id || 0), 0) + 1;

const bookingIdRef = {
  get value() { return bookingIdCounter; },
  set value(v) { bookingIdCounter = v; }
};

// --- Helpers ---
function persistConfig() {
  fs.writeFileSync(path.join(__dirname, 'config', 'routes.json'), JSON.stringify(routes, null, 2));
  fs.writeFileSync(path.join(__dirname, 'config', 'fares.json'), JSON.stringify(fares, null, 2));
  fs.writeFileSync(path.join(__dirname, 'config', 'schedules.json'), JSON.stringify(schedules, null, 2));
}

function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) return res.status(503).json({ error: 'Admin API not configured (set ADMIN_API_KEY)' });
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

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

// --- Admin CRUD ---
app.post('/api/admin/routes', requireAdmin, (req, res) => {
  const route = req.body;
  if (!route.id || !route.name || !route.stops || !route.description) {
    return res.status(400).json({ error: 'Missing required fields: id, name, stops, description' });
  }
  if (routes.find(r => r.id === route.id)) {
    return res.status(409).json({ error: 'Route ID already exists' });
  }
  routes.push(route);
  persistConfig();
  res.status(201).json(route);
});

app.put('/api/admin/routes/:id', requireAdmin, (req, res) => {
  const idx = routes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Route not found' });
  routes[idx] = { ...routes[idx], ...req.body, id: req.params.id };
  persistConfig();
  res.json(routes[idx]);
});

app.delete('/api/admin/routes/:id', requireAdmin, (req, res) => {
  const idx = routes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Route not found' });
  routes.splice(idx, 1);
  delete schedules[req.params.id];
  delete fares.routes[req.params.id];
  persistConfig();
  res.json({ deleted: req.params.id });
});

app.put('/api/admin/fares/:routeId', requireAdmin, (req, res) => {
  if (!routes.find(r => r.id === req.params.routeId)) {
    return res.status(404).json({ error: 'Route not found' });
  }
  if (typeof req.body.flat_fare !== 'number') {
    return res.status(400).json({ error: 'flat_fare must be a number' });
  }
  fares.routes[req.params.routeId] = { flat_fare: req.body.flat_fare };
  if (req.body.base_fare !== undefined) fares.base_fare = req.body.base_fare;
  if (req.body.per_stop !== undefined) fares.per_stop = req.body.per_stop;
  if (req.body.currency !== undefined) fares.currency = req.body.currency;
  persistConfig();
  res.json(fares.routes[req.params.routeId]);
});

app.put('/api/admin/schedules/:routeId', requireAdmin, (req, res) => {
  if (!routes.find(r => r.id === req.params.routeId)) {
    return res.status(404).json({ error: 'Route not found' });
  }
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Body must be an array of {departure, arrival}' });
  }
  schedules[req.params.routeId] = req.body;
  persistConfig();
  res.json(schedules[req.params.routeId]);
});

// --- Webhooks ---
app.post('/webhook/telegram', async (req, res) => {
  try {
    // Validate webhook secret if configured
    if (TELEGRAM_SECRET && req.headers['x-telegram-bot-api-secret-token'] !== TELEGRAM_SECRET) {
      return res.sendStatus(403);
    }
    const update = req.body;
    if (!update || typeof update !== 'object') return res.sendStatus(200);
    if (!update.message && !update.callback_query && !update.my_chat_member) return res.sendStatus(200);

    const miniAppUrlFallback = `https://${req.hostname}/app`;
    await telegramBot.handleUpdate(update, miniAppUrlFallback);
  } catch (err) {
    console.error('Telegram webhook error:', err);
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
    if (!Array.isArray(body.entry)) return res.sendStatus(200);

    await Promise.all(body.entry.flatMap(entry => {
      if (!entry.messaging || !Array.isArray(entry.messaging)) return [];
      return entry.messaging.map(async (event) => {
        try {
          if (event.message && typeof event.message.text === 'string') {
            await messengerBot.handleMessage(event.sender.id, event.message.text);
          } else if (event.postback && event.postback.payload) {
            await messengerBot.handlePostback(event.sender.id, event.postback.payload);
          }
        } catch (err) {
          console.error('Messenger event error:', err);
        }
      });
    }));
  } catch (err) {
    console.error('Messenger webhook error:', err);
  }
  res.status(200).send('EVENT_RECEIVED');
});

// --- Booking API ---
app.get('/api/bookings', (req, res) => {
  res.json(getBookings());
});

app.get('/api/bookings/:chatId', (req, res) => {
  if (!req.params.chatId) return res.status(400).json({ error: 'chatId is required' });
  const userBookings = getBookings().filter(b =>
    String(b.chatId) === String(req.params.chatId) || b.messengerId === req.params.chatId
  );
  res.json(userBookings);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    routes: routes.length,
    bookings: getBookings().length,
    uptime: process.uptime(),
    admin: !!ADMIN_KEY
  });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Start ---
const server = app.listen(PORT, () => {
  console.log(`Hi-Way-Shuttle running on port ${PORT}`);
});

// --- Graceful shutdown ---
function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  saveBookings();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced exit after 5s timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
