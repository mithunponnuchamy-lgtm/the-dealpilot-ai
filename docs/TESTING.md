# Verification report — October 16, 2026

## Executed successfully
- Initial backend health check: 1 test passed before extension.
- Final backend suite: **30 passed** with pytest on Python 3.12 and a real SQLite database. External API responses are mocked.
- Next.js production build: passed.
- TypeScript `tsc --noEmit`: passed.
- Tracked source scan: no private .env files, database files or API-key-shaped values included.

A Starlette warning says its HTTPX TestClient transport is deprecated in favor of HTTPX2. It did not fail tests. Dependencies are locked to the tested versions; assess that migration before later upgrades. npm also reports a host proxy-config warning, unrelated to app type checking.

## What the backend suite covers
| Scenario | Evidence |
| --- | --- |
| Health + database connection | API test |
| Create/list, private minimum hidden, unrelated access | API tests |
| Invitation rotation revokes prior access | API test |
| Empty brief / invalid asking price | Validation tests |
| Zero, negative, fractional or boolean offer | Four parameterized cases |
| Revised terms invalidate approvals; stale version rejected | API test |
| Low offer, rejection and new proposal | API test |
| Client cannot impersonate freelancer; one approval blocks payment | API test |
| Deal cancellation prevents later proposals | API test |
| Backend amount, locked terms, duplicate order/capture | API + mocked PayPal tests |
| Wrong amount, currency or order ID never marks Paid | Three cases |
| Provider timeout then retry retains original order | API test |
| Completed order reconciles without another capture | API test |
| Checkout cancellation retains order; actual completion wins | API test |
| Missing AI key and private context omission | API test |
| Invalid AI JSON rejected | Mocked HTTP test |
| PayPal token/order/capture URLs and request IDs | Mocked HTTP transport test |
| Non-sandbox or unexpected approval URL rejected | Three cases |
| Valid structured AI response validated | Mocked HTTP transport test |
| Record survives separate Python process restart | Subprocess test |
| Four simultaneous checkout requests create one order | Concurrent API test |
| AI budget of 20 requests per deal per hour | API test |
| Order creation timeout preserves persistent retry ID | API test |

The concurrency test uses SQLite; PostgreSQL locking still needs its own execution. The restart subprocess test verifies deals, while payment recovery is separately tested across new database sessions with mocked provider state.

## Authored but NOT executed
Playwright browser tests cover two role sessions, approval, refresh persistence and mobile entry width. No permitted browser-testing capability is available in this workspace. No browser installation, screenshots or UI-test pass claims are made.

To run locally after setup, stop your usual backend/frontend servers so ports 8000 and 3000 are free:
```powershell
cd frontend
$env:PLAYWRIGHT_PYTHON = (Resolve-Path ../backend/.venv/Scripts/python.exe).Path
npx playwright install chromium
npm run test:e2e
```
The test server uses a temporary SQLite database and explicitly blank provider keys. It cannot contact payment or AI providers with your credentials.

## Required manual acceptance checks
- [ ] Run a real AI extraction; confirm questions, assumptions and JSON validation.
- [ ] Create and capture a real PayPal **Sandbox** order using separate buyer/merchant accounts.
- [ ] Match actual capture ID, approved version, USD currency and amount against PayPal merchant records.
- [ ] Refresh and repeat verification; confirm no second charge/capture.
- [ ] Cancel checkout, then resume the same order.
- [ ] Interrupt backend after provider capture; restart and reconcile original order.
- [ ] Simulate provider network errors; confirm no fabricated success.
- [ ] Test PostgreSQL, Docker containers and deployed HTTPS return URLs.
- [ ] Run Playwright, inspect desktop/mobile layouts and keyboard navigation.
- [ ] Run PowerShell scripts on Windows; validate clean checkout setup.
- [ ] Record screenshots and real video only after these pass.

No real external payment, live-mode transaction, AI API call, hosted deployment or browser journey has been verified in this build.
