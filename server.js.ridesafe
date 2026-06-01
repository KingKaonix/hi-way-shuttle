require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { createTelegramBot } = require('./bots/telegram');
const { createMessengerBot } = require('./bots/messenger');
const { getBookings, addBooking, cancelBooking, loadBookings, saveBookings } = require('./store');
const { startPolling } = require('./poller');

// --- Simple in-memory auth ---
const users = [];
const tokens = {};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Seed a default admin user
users.push({ id: 1, email: 'admin@hiway.shuttle', name: 'Admin', password: hashPassword('admin123'), role: 'admin' });

// --- In-memory trip store ---
const tripsStore = {};

function generateTripsForDate(dateStr) {
  const schedule = Object.entries(schedules).flatMap(([routeId, slots]) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return [];
    return slots.map((slot, i) => ({
      id: parseInt(routeId.replace(/\D/g, '') + String(i) + dateStr.replace(/-/g, '').slice(-4), 10),
      route_id: routeId,
      route_name: route.name,
      departure_time: slot.departure,
      arrival_time: slot.arrival,
      date: dateStr,
      capacity_total: 20,
      capacity_available: 20,
    }));
  });
  tripsStore[dateStr] = schedule;
  return schedule;
}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_API_KEY || '';
const TELEGRAM_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const reactDist = path.join(__dirname, 'packages', 'web', 'dist');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets only (not index.html — handled by custom routes below)
app.use('/assets', express.static(path.join(reactDist, 'assets')));
app.use('/mini-app', express.static(path.join(__dirname, 'public', 'mini-app')));
app.use('/favicon.svg', express.static(path.join(reactDist, 'favicon.svg')));

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

// Landing page (the fancy one)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// React SPA — all non-API/asset routes
app.get('/login', spa);
app.get('/register', spa);
app.get('/routes', spa);
app.get('/bookings', spa);
app.get('/admin', spa);
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mini-app', 'index.html'));
});
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mini-app', 'index.html'));
});

function spa(req, res) {
  const reactIndex = path.join(reactDist, 'index.html');
  if (fs.existsSync(reactIndex)) {
    return res.sendFile(reactIndex);
  }
  res.status(503).send('React app not built yet');
}

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

// --- Auth API ---
app.post('/api/auth/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) return res.status(400).json({ error: 'Missing required fields: email, name, password' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: users.length + 1, email, name, password: hashPassword(password), role: 'user' };
  users.push(user);
  const token = generateToken();
  tokens[token] = user;
  const { password: _, ...safe } = user;
  res.status(201).json({ user: safe, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = users.find(u => u.email === email && u.password === hashPassword(password));
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const token = generateToken();
  tokens[token] = user;
  const { password: _, ...safe } = user;
  res.json({ user: safe, token });
});

app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = auth.slice(7);
  const user = tokens[token];
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// --- Trips API ---
app.get('/api/trips', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  if (!tripsStore[date]) generateTripsForDate(date);
  res.json(tripsStore[date]);
});

app.post('/api/trips/generate', (req, res) => {
  const date = req.body.date || new Date().toISOString().split('T')[0];
  const trips = generateTripsForDate(date);
  res.json(trips);
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
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const user = tokens[token];
    if (user) {
      const userBookings = getBookings().filter(b => b.userEmail === user.email);
      return res.json(userBookings);
    }
  }
  res.json(getBookings());
});

app.get('/api/bookings/:chatId', (req, res) => {
  if (!req.params.chatId) return res.status(400).json({ error: 'chatId is required' });
  const userBookings = getBookings().filter(b =>
    String(b.chatId) === String(req.params.chatId) || b.messengerId === req.params.chatId
  );
  res.json(userBookings);
});

app.post('/api/bookings', (req, res) => {
  const { route, departure, arrival, trip_id, seats, chatId, messengerId } = req.body;
  let routeName = route;
  let depTime = departure;
  let arrTime = arrival;
  let fareAmount = null;

  if (trip_id) {
    const allTrips = Object.values(tripsStore).flat();
    const trip = allTrips.find(t => t.id === trip_id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    routeName = trip.route_name;
    depTime = trip.departure_time;
    arrTime = trip.arrival_time;
    const routeFare = fares.routes[trip.route_id];
    fareAmount = routeFare ? routeFare.flat_fare : fares.base_fare;
    const seatCount = seats || 1;
    if (trip.capacity_available < seatCount) return res.status(409).json({ error: 'Not enough seats' });
    trip.capacity_available -= seatCount;
  }

  if (!routeName || !depTime || !arrTime) {
    return res.status(400).json({ error: 'Missing required fields: route, departure, arrival (or trip_id)' });
  }

  let userEmail = undefined;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const user = tokens[auth.slice(7)];
    if (user) userEmail = user.email;
  }

  const booking = addBooking({
    id: bookingIdRef.value++,
    route: routeName,
    departure: depTime,
    arrival: arrTime,
    fare_amount: fareAmount,
    chatId: chatId ? String(chatId) : undefined,
    messengerId: messengerId || undefined,
    userEmail,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  });
  res.status(201).json(booking);
});

app.post('/api/bookings/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid booking ID' });
  const booking = cancelBooking(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    routes: routes.length,
    bookings: getBookings().length,
    uptime: process.uptime(),
    polling: !!process.env.POLLING,
    admin: !!ADMIN_KEY
  });
});

// --- 404 ---
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // Try React SPA as fallback for unknown frontend routes
  const reactIndex = path.join(reactDist, 'index.html');
  if (fs.existsSync(reactIndex)) {
    return res.sendFile(reactIndex);
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('WARNING: TELEGRAM_BOT_TOKEN not set — Telegram bot will not work');
}

const server = app.listen(PORT, () => {
  console.log(`Hi-Way-Shuttle running on port ${PORT}`);

  if (process.env.TELEGRAM_BOT_TOKEN && (process.env.POLLING || !TELEGRAM_SECRET)) {
    console.log('Starting Telegram polling loop...');
    startPolling(process.env.TELEGRAM_BOT_TOKEN, (update, fallback) =>
      telegramBot.handleUpdate(update, fallback)
    ).catch(err => console.error('Poller exited:', err));
  } else if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('Telegram bot disabled — set TELEGRAM_BOT_TOKEN to enable');
  }
});

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
