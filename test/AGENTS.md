# Tests — Agent Instructions

## Overview

Single smoke test file (`smoke.js`) using Node's built-in `http` module — no test framework. The CI workflow (`../.github/workflows/ci.yml`) starts the server, runs the tests, and kills the server.

## Running

```bash
npm test
```

This runs `node test/smoke.js`. The server must already be running on port 3000. CI handles this automatically.

## Test Structure

- `request(method, path)` — helper that returns `{ status, body }`.
- `check(name, condition)` — logs `ok` or `FAIL` and increments counters.
- Tests are sequential `await` calls.
- Exit code: `0` if all pass, `1` if any fail.

## Current Coverage (25 tests)

| Area | Tests |
|------|-------|
| Health | `GET /health` returns 200, has routes count, has uptime |
| Routes | List returns 200, is array, has 3 items, has fields, single returns 200 with schedule/fare, 404 for missing |
| Schedules | Returns 200, is array, has departure/arrival, 404 for missing |
| Fares | All fares, has base_fare and currency, single route fare |
| Bookings | Returns 200, is array |
| Other | 404 for unknown endpoint, landing page returns 200 with title |

## Adding Tests

- Add new `check()` calls in sequence inside `run()`.
- Use the same `request()` helper.
- Keep tests independent (no shared state between test assertions).
- Test both success and error cases (200 and 4xx).
- For admin endpoints, tests should verify 401 without auth key.
