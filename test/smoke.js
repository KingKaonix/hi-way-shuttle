const http = require('http');

let passed = 0;
let failed = 0;

async function request(method, path) {
  return new Promise((resolve, reject) => {
    const opts = { method, hostname: 'localhost', port: 3000, path };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

function check(name, condition) {
  if (condition) { console.log(`  ok ${name}`); passed++; }
  else { console.log(`  FAIL ${name}`); failed++; }
}

async function run() {
  console.log('Smoke Tests\n');

  const health = await request('GET', '/health');
  check('GET /health returns 200', health.status === 200);
  const h = JSON.parse(health.body);
  check('/health has routes', typeof h.routes === 'number');
  check('/health has uptime', typeof h.uptime === 'number');

  const routesRes = await request('GET', '/api/routes');
  check('GET /api/routes returns 200', routesRes.status === 200);
  const routes = JSON.parse(routesRes.body);
  check('Routes is array', Array.isArray(routes));
  check('Has 3 routes', routes.length === 3);
  check('Route has id, name, stops', routes[0].id && routes[0].name && routes[0].stops);

  const routeRes = await request('GET', '/api/routes/rt-dw-01');
  check('GET /api/routes/:id returns 200', routeRes.status === 200);
  const route = JSON.parse(routeRes.body);
  check('Route has schedule', Array.isArray(route.schedule));
  check('Route has fare', route.fare && typeof route.fare.flat_fare === 'number');

  const nfRes = await request('GET', '/api/routes/noexist');
  check('GET /api/routes/:id 404', nfRes.status === 404);

  const schedRes = await request('GET', '/api/schedules/rt-dw-01');
  check('GET /api/schedules/:id returns 200', schedRes.status === 200);
  const sched = JSON.parse(schedRes.body);
  check('Schedule is array', Array.isArray(sched));
  check('Schedule has departure/arrival', sched[0].departure && sched[0].arrival);

  const sched404 = await request('GET', '/api/schedules/bad');
  check('GET /api/schedules/:id 404', sched404.status === 404);

  const faresRes = await request('GET', '/api/fares');
  check('GET /api/fares returns 200', faresRes.status === 200);
  const fares = JSON.parse(faresRes.body);
  check('Fares has base_fare', typeof fares.base_fare === 'number');
  check('Fares currency is USD', fares.currency === 'USD');

  const fareRouteRes = await request('GET', '/api/fares?route=rt-ap-02');
  check('GET /api/fares?route= returns 200', fareRouteRes.status === 200);
  const fareRoute = JSON.parse(fareRouteRes.body);
  check('Route fare has flat_fare', typeof fareRoute.flat_fare === 'number');

  const bkRes = await request('GET', '/api/bookings');
  check('GET /api/bookings returns 200', bkRes.status === 200);
  const bk = JSON.parse(bkRes.body);
  check('Bookings is array', Array.isArray(bk));

  const nf = await request('GET', '/api/noexist');
  check('Unknown endpoint returns 404', nf.status === 404);

  const landing = await request('GET', '/');
  check('GET / returns 200', landing.status === 200);
  check('Landing page has Hi-Way-Shuttle', landing.body.includes('Hi-Way-Shuttle'));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => { console.error('Test error:', err.message); process.exit(1); });
