/**
 * HiWay Geocode Service
 * Uses Nominatim (OpenStreetMap) for address resolution
 * Rate limited + in-memory LRU cache
 */

const express = require('express');
const https = require('https');
const router = express.Router();

// --- Simple LRU Cache ---
const cache = new Map();
const CACHE_MAX = 500;

function cacheGet(key) {
  if (cache.has(key)) {
    const val = cache.get(key);
    cache.delete(key);
    cache.set(key, val);
    return val;
  }
  return null;
}

function cacheSet(key, val) {
  if (cache.has(key)) cache.delete(key);
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, val);
}

// --- Rate limiter (60 req/min per IP) ---
const rateLimits = new Map();
const RATE_WINDOW = 60000;
const RATE_MAX = 60;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimits.set(ip, { start: now, count: 1 });
    return next();
  }

  if (entry.count >= RATE_MAX) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in 60 seconds.' });
  }

  entry.count++;
  next();
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now - entry.start > RATE_WINDOW) rateLimits.delete(ip);
  }
}, 300000);

// --- Nominatim API call ---
function nominatimSearch(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&addressdetails=1&limit=5`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'HiWay-Shuttle/1.0 (local-rideshare)',
        'Accept': 'application/json'
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from geocoding service'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Geocoding service timeout'));
    });
  });
}

// --- Routes ---

/**
 * GET /api/geocode?q=Burger+King+Price+UT
 * Returns resolved locations
 */
router.get('/', rateLimit, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  // Check cache
  const cacheKey = q.toLowerCase();
  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.json({ results: cached, cached: true });
  }

  try {
    const raw = await nominatimSearch(q);
    const results = raw.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      address: item.address || {},
      type: item.type || '',
      category: item.category || '',
      importance: item.importance || 0
    }));

    // Sort by importance (most relevant first)
    results.sort((a, b) => b.importance - a.importance);

    // Cache results
    cacheSet(cacheKey, results);

    res.json({ results });
  } catch (err) {
    console.error('Geocode error:', err.message);
    res.status(502).json({ error: 'Geocoding service unavailable' });
  }
});

module.exports = router;
