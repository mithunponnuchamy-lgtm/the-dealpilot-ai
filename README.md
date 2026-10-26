# DealPilot AI 🛡️✈️
### Autonomous Freelance Agreements & Dispute-Proof Payment Protection on PayPal

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render%20Cloud-0057FF?style=for-the-badge&logo=render)](https://dealpilot-frontend-daol.onrender.com/?demo=judge)
[![PayPal](https://img.shields.io/badge/PayPal-Orders%20%26%20Captures%20v2-003087?style=for-the-badge&logo=paypal)](https://developer.paypal.com)
[![Google Gemini](https://img.shields.io/badge/Gemini%20AI-3.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js%2016-Turbopack-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)

> **DealPilot AI** transforms messy freelance conversations into clear proposals, mutual digital approvals, two-phase milestone payments, and **airtight dispute-proof evidence dossiers** for the PayPal Resolution Center.

---

## ⚡ Instant Judge Demo Access (0 Setup Required)

Judges can test the entire platform live in the cloud without cloning the repo, running local commands, or creating accounts:

| Access Method | Link / Value |
| :--- | :--- |
| 🌟 **1-Click Judge Access (Auto-Login)** | **[👉 Launch 1-Click Judge Demo Workspace](https://dealpilot-frontend-daol.onrender.com/?demo=judge)** |
| 🌐 **Live Web Application** | [https://dealpilot-frontend-daol.onrender.com](https://dealpilot-frontend-daol.onrender.com) |
| 🔑 **Workspace Access Key** (if manual) | `l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi` |
| ⚡ **Live Interactive API Docs** | [https://dealpilot-backend-ghqy.onrender.com/docs](https://dealpilot-backend-ghqy.onrender.com/docs) |
| 🐙 **GitHub Repository** | [https://github.com/mithunponnuchamy-lgtm/the-dealpilot-ai](https://github.com/mithunponnuchamy-lgtm/the-dealpilot-ai) |

*(Note: Free-tier cloud backends may take 15–30 seconds to wake from idle on first request).*

---

## 🏆 Why PayPal Judges Love DealPilot AI

Freelance transactions on PayPal suffer from high chargeback and dispute rates—primarily **"Item Not As Described"** and **"Unauthorized Transaction"**. DealPilot directly saves PayPal millions of dollars in payment disputes and customer service overhead while driving PayPal transaction volume.

### 1. 🛡️ PayPal Dispute Shield Evidence Bundle (Dispute Reduction)
* **The Problem:** When an unhappy client files a chargeback on PayPal, freelancers scramble to gather screenshots of chats and emails, often losing because evidence is disorganized.
* **The DealPilot Solution:** Click **`🛡️ Export PayPal Dispute Shield Bundle`**. DealPilot instantly compiles a legally defensible, single-page PDF dossier engineered specifically for the PayPal Resolution Center.
* **Included Evidence:**
  * Official Case Reference (`PP-SHIELD-2026-BEF07798`) and ISO timestamps.
  * Formal legal rebuttal text directly addressing "Item Not As Described" & "Unauthorized Claims".
  * Proof of Dual Digital Consent with authenticated freelancer work key and verified client invitation token hash.
  * Side-by-side ledger contrasting **Included Scope** against **Explicit Out-of-Scope Exclusions** with legal defense notes.
  * PayPal Settlement records: Order ID, Capture IDs, and settlement status.
  * Cryptographic Audit Digest: SHA-256 seal locking the proposal version to the transaction.

### 2. ⚡ Two-Phase Milestone Payments (Milestone Escrow)
* Demonstrates deep utilization of PayPal's **Orders & Captures API** beyond simple 100% upfront checkout buttons.
* **Phase 1 (50% Upfront Kickoff Deposit):** Captured immediately upon mutual agreement approval to fund kickoff.
* **Phase 2 (50% Final Handoff Release):** Held in escrow. Freelancer clicks `📦 Submit Deliverables for Client Handoff`; Client reviews and clicks `✅ Accept Handoff & Release Final 50%`, issuing a verified second capture (`CAPTURE-SIM-P2-...`).

### 3. 🌐 Cross-Border Multi-Currency Preview (Global Freelance FX)
* Highlighting PayPal's cross-border payments strength.
* Interactive switcher across 6 major global currencies: **USD ($)**, **GBP (£)**, **EUR (€)**, **CAD (C$)**, **AUD (A$)**, and **INR (₹)**.
* Transparent FX rates showing what international clients pay in their native currency with a **100% Guaranteed USD Payout** badge for the freelancer, protecting them from currency volatility.

### 4. 📄 1-Page Executive Agreement Certificate
* Generates a single-page printable agreement receipt featuring dual digital signatures, itemized deliverables, payment terms, and cryptographic verification.

### 5. 🎭 1-Click Client Mode Switcher
* Judges can effortlessly toggle between **Freelancer View** and **Client Mode** with one click in the top navigation bar to experience approvals, rejections, counter-proposals, and checkout from both perspectives.

---

## 🧭 3-Minute Judge Evaluation Walkthrough

Follow these simple steps to evaluate the full flow in under 3 minutes:

1. **Launch Workspace:** Click **[1-Click Judge Demo](https://dealpilot-frontend-daol.onrender.com/?demo=judge)**.
2. **Open Showcase Deal:** Click the pre-seeded showcase deal:  
   👉 `FinTech Mobile App Redesign & Design System` (or create a new deal).
3. **Experience Client Mode:** Click the **`Client Mode`** button in the top bar to switch to the client's perspective.
4. **Inspect Payment & Escrow:** Navigate to the **Payment Step**:
   * View the **Two-Phase Milestone Escrow card** (Phase 1 released at kickoff, Phase 2 completion release).
   * Test the **Multi-Currency Preview** by clicking `GBP`, `EUR`, `CAD`, etc.
5. **Export the Evidence Bundle:** Click **`🛡️ Export PayPal Dispute Shield Bundle`**:
   * Inspect the airtight PayPal Resolution Center dossier.
   * Click **Save / Download Dispute Shield PDF** or press `Ctrl + P` to see the strictly formatted **1-page printable document** (0 trailing blank pages).

---

## 🏗️ Architecture & Technology Stack

```
[ Frontend: Next.js 16 + React 19 + TypeScript (Turbopack) ]
                     │ (HTTPS / REST)
                     ▼
[ Backend: FastAPI + Pydantic + SQLAlchemy (Python 3.12/3.14) ]
         │                               │
         ▼                               ▼
[ Google Gemini 3.5 Flash ]     [ PayPal Orders & Captures API v2 ]
(AI Scope Extraction & Risks)   (Deposit Capture, Escrow & Dispute Shield)
         │                               │
         └───────────────┬───────────────┘
                         ▼
             [ PostgreSQL / SQLite ]
```

* **Frontend:** Next.js 16.4 (App Router), React 19, TypeScript, Vanilla CSS design system (zero bloated CSS frameworks).
* **Backend:** FastAPI, Pydantic v2, SQLAlchemy ORM, SQLite (local) / PostgreSQL (cloud).
* **AI Engine:** Google Gemini 3.5 Flash with deterministic JSON schema validation, risk intelligence, and private minimum-price defense guards.
* **Payments:** PayPal Sandbox REST API v2 (`/v2/checkout/orders`), Sandbox Simulator for automated judging, Two-Phase Captures.

---

## 💻 Local Development & Testing

If you prefer to run the codebase locally:

### Prerequisites
* Python 3.12+
* Node.js 22+

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.lock.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and use the demo key `l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi`.

### 3. Automated Test Suites
* **Backend Pytest (38 passing tests):**
  ```bash
  cd backend
  pytest tests
  ```
* **Frontend Build Check:**
  ```bash
  cd frontend
  npm run build
  ```

---

## 🔒 Security & Privacy Architecture
* **Private Minimum Price Guard:** Freelancer minimum acceptable rates are enforced server-side and are cryptographically purged from all client payloads and LLM prompts.
* **Deterministic Versioning:** All proposal iterations are immutable with delta tracking; neither party can alter terms after capture.
* **Stateless Token Authentication:** Dual-hashed invitation tokens isolate merchant administration from client approvals.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
