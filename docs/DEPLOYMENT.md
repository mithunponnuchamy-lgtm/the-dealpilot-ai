# Deployment preparation

Status: configuration and Dockerfiles supplied; nothing has been deployed.

Keep the requested FastAPI architecture. Sites hosting runs JavaScript Workers and cannot directly host this Python backend, so a disconnected hosted frontend has not been published as if it were a complete app.

## Backend + PostgreSQL
1. Choose a host that supports the supplied Dockerfile (for example a container web service) and provision managed PostgreSQL. Review current account costs, sleep policies, quotas and region choices before creating paid resources.
2. Set the build context to `backend/`. The container listens on port 8000. Configure the host to route to that port.
3. Configure `DATABASE_URL` with the SQLAlchemy `postgresql+psycopg://` scheme and host-required TLS settings. Store it as a secret.
4. Set `WORKSPACE_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` in the host's secret settings. Use only Sandbox PayPal credentials.
5. Set `FRONTEND_URL` to the exact HTTPS frontend origin. Use `/health` for health checks.
6. Start with one backend instance. Verify PostgreSQL-backed tests and concurrent requests before scaling. Current schema uses startup creation, not migrations.

## Frontend
1. Deploy the `frontend/` Next.js project to a compatible Node host or Vercel.
2. Set `NEXT_PUBLIC_API_URL` to the HTTPS backend URL **before building**. This URL is public; it must contain no credentials.
3. Build with `npm ci && npm run build`; start with `npm start` when the host needs a server command.
4. Update backend `FRONTEND_URL` and redeploy/restart as necessary. Test CORS and PayPal return/cancel URLs.

## Judge access
Use a dedicated sandbox-only workspace with synthetic data. Do not publish freelancer/client tokens in the repository. Give judges access through the official submission instructions if needed. The submission must remain accessible during judging.

## Before sharing
- Run `docs/TESTING.md`, including real sandbox checkout, actual browser flows and PostgreSQL.
- Add HTTPS and edge request limits. Restrict access until validation is complete.
- Capture screenshots only after browser testing. Keep credentials and payment account details out of recording.
- Record actual URLs and tested environment in STATUS.md.

## GitHub publication
A local Git repository can be initialized and committed without account access. No remote repository has been created or modified here. Once you authorize publication and connect GitHub, push the reviewed source with MIT LICENSE. Keep `.env`, local databases, dependencies and runtime files excluded.

Review before publishing:
```sh
git status --short
git ls-files
```
Do not force-push or overwrite an existing project. A public source URL is necessary for final submission; a local ZIP alone does not satisfy that requirement.
