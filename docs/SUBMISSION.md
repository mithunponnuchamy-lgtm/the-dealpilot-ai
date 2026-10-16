# Hackathon submission preparation

## Official requirements verified on October 16, 2026
Source: https://paypalaihackathon.devpost.com/rules

The published rules give a deadline of November 12, 2026 at **12:00 PM Pacific**, not 2 PM in the registration email. In India this is November 13 at 1:30 AM IST. Use November 11 as the completion target and recheck the rules before submitting.

The app must substantially integrate AI and the PayPal developer platform with Sandbox use. Supply a functional build or hosted demo, a public open-source repository with license, a description, and a publicly visible YouTube demo under three minutes. The rules require age-of-majority eligibility at entry and contain location/conflict exclusions; registration alone does not settle eligibility. Read the full official rules yourself before submission. Keep judge access available through the judging period (published as December 1–15).

## Project description draft — update after acceptance testing
DealPilot AI helps freelancers and clients turn project conversations into clear proposals and a connected payment record.

A client describes the work. AI extracts a structured draft and asks about missing details. Both people can propose changes to scope, price, delivery time and revisions. The app keeps each proposal version and shows exactly what changed.

Both people must explicitly approve the same version before checkout. The backend creates a PayPal Sandbox order using the approved amount, then verifies the capture and links the transaction to that proposal. The browser and AI cannot choose the payment amount or mark a deal paid.

The main difference is the connection between negotiation, version history, mutual approval and payment. AI helps people think through trade-offs, while backend rules control approval and payment.

**Verification disclosure as of this build:** manual proposal workflows and payment security behavior have automated tests. AI and PayPal HTTP adapters are tested with mocked responses. A real model response and a completed PayPal Sandbox transaction still need credentials and acceptance testing. Do not remove this disclosure until those tests have passed.

## Tools used
- Next.js, React, TypeScript and custom CSS: responsive interface.
- Python, FastAPI and Pydantic: API, access checks and validated input.
- SQLAlchemy: relational models; SQLite locally, PostgreSQL deployment configuration.
- OpenAI Chat Completions: schema-constrained requirement extraction and negotiation advice.
- PayPal Orders v2: server-side sandbox order creation, buyer approval, capture and verification.
- Pytest and HTTPX: workflow and provider-response tests.
- Git, Docker and npm: source management, deployment preparation and reproducible dependencies.

## Demo script — target 2 minutes 40 seconds
Record only once real sandbox acceptance tests pass. Do not replace real results with simulated payment screens.

**0:00–0:18 — Problem.** “Freelancers often discuss a project in chat, write terms somewhere else, then send a separate payment request. It becomes hard to tell exactly what both people agreed to.” Show the workspace.

**0:18–0:40 — Requirements.** “DealPilot connects those steps. Here, the client describes a portfolio website. AI extracts the brief and asks what is still missing.” Show a real extraction, questions and assumptions.

**0:40–1:10 — Negotiation.** “The first offer is five pages for $300. The client wants to spend $250. We review an AI suggestion and create a revised three-page offer.” Show the real version comparison.

**1:10–1:35 — Human control.** “A changed offer needs new approval from both people. The client cannot approve as the freelancer, and the private minimum price stays hidden.” Approve the same current version in the two sessions.

**1:35–2:10 — Payment.** “The backend creates a PayPal Sandbox order for that exact version. The client approves with a sandbox account. DealPilot verifies the captured amount before showing Paid.” Show actual checkout and verification; avoid credentials on screen.

**2:10–2:30 — Evidence.** Show the capture reference and linked proposal version. “Refreshing or repeating verification does not create another capture.”

**2:30–2:40 — Close.** “AI helps us discuss the deal. People approve it. PayPal completes the sandbox payment, and DealPilot keeps the record connected.”

## Final checklist
- [ ] Eligibility checked against complete rules.
- [ ] Real AI output validated.
- [ ] Real sandbox order/capture verified; no real funds.
- [ ] Browser and PostgreSQL acceptance checks complete.
- [ ] Public repository URL, MIT license and reproducible setup verified from clean checkout.
- [ ] Demo screenshots captured after testing.
- [ ] Real screen recording edited under three minutes and publicly uploaded to YouTube.
- [ ] Description updated to reflect only verified behavior.
- [ ] Working demo/setup and judge access supplied.
- [ ] Submission completed at least one day early.

Public repository URL: pending.
Hosted demo URL: pending (a reproducible working build is an allowed alternative).
YouTube URL: pending.
