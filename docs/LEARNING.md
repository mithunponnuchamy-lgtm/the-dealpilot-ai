# Learn DealPilot by building

## 1. API: a named request to your Python program
**Concept:** An API lets one program ask another program to perform a specific task.
**Purpose:** The website needs Python to save and validate deals.
**Code:** `backend/app/main.py` has `@app.get('/health')`. The decorator connects a URL to the function underneath it.
**Example:** Open `http://localhost:8000/health`. You receive JSON such as `{"status":"ok","database":"connected","payments":"sandbox only"}`.
**Test:** `tests/test_health.py` checks the endpoint and database connection. This test was executed successfully.
**Checkpoint:** Why does the website ask the backend whether the database is working?

## 2. Database: shared memory that survives closing the app
Your Lesson 5 JSON file saved a dictionary. A database stores related records and applies rules when several requests arrive.
`models.py` defines Deal, Offer, Approval, Payment and Event. `SessionLocal()` opens a unit of database work. `db.add(d)` stages a record and `db.commit()` saves it.
Create a deal, restart the backend and reopen it. An automated separate-process test verifies this persistence with SQLite. PostgreSQL still needs its own runtime check.
**Checkpoint:** What would happen if deals existed only in a Python list?

## 3. Schema: the shape of acceptable input
`schemas.py` is the boundary between untrusted requests and business logic.
`amount_cents: int = Field(gt=0, strict=True)` means: require an integer greater than zero. $250 becomes 25000 cents. This avoids float rounding when handling money.
`extra='forbid'` rejects unexpected fields. A client cannot add `role: freelancer` to approve as the other person.
Tests send negative, zero, fractional and boolean amounts; each is rejected.
**Checkpoint:** Why should the backend check an amount even when the form already checks it?

## 4. Authorization: who may do what?
Authentication asks “what credential do you have?” Authorization asks “what may that credential do?”
`security.py` recognizes the freelancer token or the client's private invitation hash. A client can access only their deal. Only the client starts checkout. A public minimum price would weaken negotiation, so client API responses omit it.
Automated tests cover unrelated access, forged roles and invitation rotation.
**Checkpoint:** Is hiding a button enough to stop an unauthorized API request?

## 5. Versioning: approvals belong to exact terms
An Offer contains the deliverables, price, exclusions, delivery days and revision count. Editing means inserting a new Offer, not overwriting the old one.
Approvals reference the Offer ID. They do not automatically move to the next version. The `expected_version` value also detects a stale form.
The comparison service calculates before/after values from stored data. AI only explains these differences.
Tests verify a new version has no approvals and cannot be paid immediately.
**Checkpoint:** Why should a $250 approval not authorize a later $300 version?

## 6. AI: a helper with a validated answer format
`services/ai.py` sends public context and a JSON schema to an LLM. Pydantic validates the reply. Missing requirements become questions or assumptions; AI never approves or pays.
The app sends no freelancer minimum price to the model. AI can be wrong, so users manually review suggestions before creating proposals.
Provider HTTP calls and invalid JSON are tested with mocks. Real provider testing requires your private API key and API billing.
**Checkpoint:** Why should an AI recommendation not directly create an approved contract?

## 7. Payment: verify before showing Paid
The backend creates an order using the approved stored amount. The buyer approves on PayPal. The backend then captures and verifies it.
“Idempotent” means retries should not repeat the financial action. Each stored Payment has stable request IDs. If a response is lost, verification queries the original order instead of charging again.
The browser returning to your app proves only navigation—not payment. The tests intentionally use wrong amounts and repeated requests; these must not create false success.
These tests use fake provider responses only. A real Sandbox checkout is still the final acceptance test.
**Checkpoint:** Which source should decide that a deal is paid: the browser URL or PayPal's verified response?

## Your first practical task
Run the setup, open `/health`, then create one deal for a portfolio website. Open its client invitation in a private browser window. Propose $300, approve as one person, then revise to $250. Observe that both approvals are required again. Explain that behavior in your own words before connecting payments.
