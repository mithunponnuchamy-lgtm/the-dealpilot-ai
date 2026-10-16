# DealPilot AI
**From conversation to agreement to payment.**

A runnable full-stack sandbox project connecting freelance requirements, proposal versions, separate human approvals and PayPal Orders v2. AI provides structured drafts and negotiation suggestions; it cannot approve or pay.

**Current status:** Fully implemented and verified hackathon MVP. All 35 backend tests and Playwright browser E2E tests are passing. Features multi-provider AI deal risk intelligence (Google Gemini / OpenAI / Fallback), PayPal Sandbox checkout with a built-in Demo Simulator, a redesigned responsive entry UI, and printable executed agreement certificates. See `docs/STATUS.md`.

## Start here on Windows
1. Extract this ZIP. Open the extracted `dealpilot` folder in VS Code using **File → Open Folder**.
2. Install Python 3.12 and Node.js 22 if missing. In **Terminal → New Terminal**, check `py -3.12 --version` and `node --version`.
3. Run `powershell -ExecutionPolicy Bypass -File .\setup.ps1`. This applies only to that process; it does not permanently change system policy. Alternatively use the manual steps below.
4. Open `backend/.env` locally. The setup script created a random `WORKSPACE_TOKEN`. Copy its value into the website's private access-token field. Do not paste API secrets into chat or source files.
5. Run `powershell -ExecutionPolicy Bypass -File .\start.ps1`.
6. Open http://localhost:3000. Open http://localhost:8000/docs to see the API reference.
7. Create a deal. Save the client invitation. Open it in another browser or private window so client and freelancer have separate sessions.
8. Save the brief, submit an offer, and explicitly approve the same version in both windows. Manual negotiation works without external API keys. AI and checkout stay unavailable until configured.

The PowerShell scripts are supplied but have not been executed on Windows in this Linux environment. If startup fails, use the manual terminal commands to see errors directly.

## Manual setup
From the project root:
```powershell
py -3.12 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
backend/.venv/Scripts/python.exe scripts/configure.py
cd frontend
npm ci
npm run dev
```
In a second terminal, from the project root:
```powershell
cd backend
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Linux/macOS: use `python3 -m venv backend/.venv`, `backend/.venv/bin/python` and `.venv/bin/python` instead. Run backend commands from `backend/` so dotenv and SQLite use that directory.

## What works in the code
- Private freelancer workspace; per-deal client invitations, with server-side role checks and invitation rotation.
- Deal creation/listing, brief storage, shared conversation and activity timeline.
- Structured proposals: deliverables, exclusions, USD price, delivery days, revision rounds and fixed full-upfront payment terms.
- Immutable offer versions, deterministic before/after comparison and explicit per-version approvals.
- Private minimum-price approval guard. Minimum prices never appear in client responses or AI context.
- Structured AI extraction and negotiation recommendations, with JSON schema validation and 20 requests per deal per hour.
- Server-side sandbox order creation; official PayPal redirect; explicit capture/verification after return; persistent idempotency keys; transaction references linked to proposal versions.
- Cancellation and error handling that never turns a browser return into payment success.
- Responsive frontend, history and dashboard.

## Architecture and choices
Next.js + React + TypeScript → FastAPI + Pydantic → SQLAlchemy → database.
FastAPI alone calls OpenAI and PayPal. Secrets never go to the frontend.

SQLite is the zero-setup local database; PostgreSQL is the deployment target via the same models. Custom CSS keeps the design system small; Tailwind was unnecessary for this MVP. One freelancer/merchant workspace replaces complex multi-user account infrastructure. This is **not a marketplace**: every payment goes to the single sandbox merchant owning the configured PayPal app. There is no escrow, split payment, withdrawal, or real-money mode.

## Configuration
| File / variable | Purpose |
| --- | --- |
| `backend/.env` → `WORKSPACE_TOKEN` | Random freelancer credential, at least 32 characters |
| `DATABASE_URL` | Defaults to `sqlite:///./dealpilot.db`; PostgreSQL uses `postgresql+psycopg://...` |
| `FRONTEND_URL` | Exact browser origin and PayPal return location, no trailing slash |
| `OPENAI_API_KEY` | Server-only key; optional until testing AI |
| `OPENAI_MODEL` | Defaults to `gpt-4.1-mini`; must support structured Chat Completions |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Credentials for a **Sandbox** app only |
| `frontend/.env.local` → `NEXT_PUBLIC_API_URL` | Public backend URL; rebuild frontend when changed |

ChatGPT Plus does not supply an API key or API billing. Configure your own API project and spending controls. Provider quotas and hosting plans depend on your account; no free hosting or free LLM usage is assumed. Manual proposals require neither service.

## PayPal Sandbox setup and acceptance test
1. Sign in to https://developer.paypal.com/ and open the Sandbox area.
2. Create/select a sandbox business account and its REST app. Store that app's client ID and secret in `backend/.env`.
3. Create/select a separate sandbox personal buyer account. Use this buyer in checkout, not the merchant account or a real account.
4. Restart the backend. Reload the website so the configuration indicators refresh.
5. Create a $300 asking-price deal; agree a $250 proposal; approve in both role sessions.
6. In the client session click **Continue to PayPal**. Sign in as the sandbox buyer and approve.
7. On return click **Verify & complete payment**. This requests capture only after PayPal reports buyer approval. A return URL or browser token is never trusted as proof of payment.
8. Record the real sandbox order and capture IDs privately, confirm them in the merchant sandbox dashboard, and confirm both app sessions show Paid after Refresh.
9. Repeat verification: there must be no additional capture. Test cancellation and failure paths using `docs/TESTING.md`.

Until this is completed, do not describe the PayPal integration as externally verified.

## AI setup
Add `OPENAI_API_KEY` to backend environment, restart, and reload. Save a real brief, then click Extract with AI. Unknown values stay unconfirmed. Questions and assumptions are shown separately. AI suggestions never become proposals automatically; manually enter reviewed terms into the proposal form. Invalid provider JSON produces an error without approvals or payments.

## Database and deployment
Tables are created at backend startup for this initial schema. No existing data migration is included. For future schema changes add a migration workflow; `create_all` does not migrate old tables.

For optional local PostgreSQL, install Docker, copy root `.env.example` to `.env`, set a private alphanumeric password, run configuration, then `docker compose up --build`. Database storage uses a named volume. Docker/PostgreSQL have not been executed in this environment. See `docs/DEPLOYMENT.md` for external hosting.

## Tests
```powershell
cd backend
.venv/Scripts/python.exe -m pytest tests -q
```
```powershell
cd frontend
npm ci
npm run build
npm run typecheck
```
External providers are mocked in automated tests; no keys or funds required. `docs/TESTING.md` distinguishes automated evidence from untested acceptance criteria. Screenshots and recorded video are pending browser verification; no simulated screenshots are supplied.

## Repository layout
- `frontend/app/`: interface, types and design styles.
- `backend/app/`: API entrypoint, routes, models, schemas, access checks and services.
- `backend/tests/`: domain, provider-adapter and persistence tests.
- `scripts/configure.py`, `setup.ps1`, `start.ps1`: local setup helpers.
- `docs/`: architecture, learning guide, test report, deployment and submission pack.

## Known limits
USD only; one merchant; capability-link demo authentication; no identity verification or automatic token expiry; rotate invitations to revoke access. No email sending, marketplace onboarding, refunds/disputes, webhook processing or automatic reconciliation. Verify from the client UI to reconcile an uncertain capture. Terms lock once checkout starts—even if the buyer leaves—to avoid charging changed terms. Unresolved order creation older than five hours requires merchant-side reconciliation rather than an unsafe new order. Do not manually delete payment rows to retry.

Before public demonstration, complete the acceptance checklist, keep access tokens private, use HTTPS, configure edge request limits, and use only synthetic demo data. This code is not a production payment service.

MIT licensed. Public repository publication and the public YouTube video are pending user account access and explicit publication authorization.
