# 🚀 PayPal AI Hackathon: Official Devpost Submission Kit

**Hackathon**: [PayPal AI Hackathon: Build What's Next with PayPal and AI!](https://paypalaihackathon.devpost.com/)  
**Submission Deadline**: November 12, 2026 at 12:00 PM Pacific (Nov 13, 1:30 AM IST)  
**Target Completion**: November 11, 2026

---

## ⚡ Quick Links for Hackathon Judges

| Resource | URL / Value | Notes |
| :--- | :--- | :--- |
| **1-Click Live Judge Showcase** | `https://dealpilot-frontend-daol.onrender.com/?demo=judge` | **Zero setup required.** Auto-authenticates and seeds sample deal. |
| **Live Web App (Manual Access)** | `https://dealpilot-frontend-daol.onrender.com` | Use workspace access key below |
| **Judge Workspace Access Key** | `l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi` | Pre-filled in input box |
| **Live Backend API** | `https://dealpilot-backend-ghqy.onrender.com` | FastAPI on Render |
| **Backend Health Endpoint** | `https://dealpilot-backend-ghqy.onrender.com/health` | Returns `database: connected, payments: sandbox only` |
| **Public GitHub Repository** | `https://github.com/mithunponnuchamy-lgtm/the-dealpilot-ai` | Open source under MIT License |

---

## 📝 Devpost Form Fields (Ready to Copy & Paste)

### 1. Project Title
```text
DealPilot AI — Autonomous Freelance Agreements & Dispute-Proof Payment Protection on PayPal
```

### 2. Elevator Pitch / Tagline (Under 200 characters)
```text
Autonomous freelance agreements with AI deliverables extraction, 2-phase milestone escrow, multi-currency FX preview, and a PayPal Dispute Shield evidence bundle.
```

### 3. Built With (Tags)
```text
python, fastapi, postgresql, next.js, react, typescript, paypal, paypal-api, gemini-api, playwright, docker, render
```

---

## 📖 Complete Project Description (Devpost Markdown)

### Inspiration
Freelancers and agencies lose billions of dollars every year to scope creep, informal verbal agreements, and devastating chargeback disputes on payment platforms. In the gig economy, agreements are negotiated across fragmented chat apps (Slack, WhatsApp, email), while invoices are sent separately on PayPal. 

When a client files an **"Item Not as Described"** or **"Unauthorized Transaction"** dispute with PayPal, freelancers are forced to scramble through weeks of unformatted chat logs, often losing their hard-earned money due to a lack of structured proof.

We built **DealPilot AI** to eliminate this friction entirely by binding the conversation, contract agreement, milestone escrow, and PayPal payment into an unbroken, immutable digital chain.

---

### What It Does
**DealPilot AI** turns messy freelance project conversations into clear, legally structured proposals, requires verifiable dual approval, and guarantees bulletproof payment execution through PayPal Sandbox:

1. **🤖 AI Deliverables & Risk Extraction**: Analyzes unstructured client briefs using AI to extract explicit deliverables, out-of-scope exclusions, turnaround time, assumptions, and critical missing information.
2. **⚖️ AI-Powered Negotiation Assistant**: When clients request budget cuts, DealPilot calculates the scope trade-offs and generates balanced revision suggestions rather than simply cutting prices.
3. **🤝 Verifiable Dual Approval Engine**: Neither party can unilaterally change terms. Both freelancer and client must authenticate and explicitly approve the exact proposal version before checkout unlocks.
4. **⚡ Two-Phase Milestone Escrow on PayPal**:
   - **Phase 1 (50% Kickoff Deposit)**: Captured upon proposal approval to fund project startup.
   - **Phase 2 (50% Final Handoff)**: Pre-authorized and securely held in escrow until formal deliverable review and client sign-off.
5. **🌐 PayPal Cross-Border Multi-Currency Preview**: Real-time FX conversion engine (supporting USD, GBP, EUR, CAD, AUD, and INR) displaying exact client costs while guaranteeing 100% fixed payout for freelancers with zero currency risk.
6. **🛡️ PayPal Dispute Shield Evidence Bundle**: Instant, print-ready PDF evidence dossier designed specifically for PayPal Resolution Center chargeback defense. Features cryptographic receipt audit hashes (`SHA-256`), dual consent verification logs, and explicit out-of-scope contractual clauses that neutralize "Item Not as Described" claims.
7. **📄 1-Page Official Agreement & Execution Certificate**: Print/PDF-ready formal execution certificate with authentic cursive digital signatures and immutable audit reference numbers.

---

### How We Built It
- **Frontend**: Next.js 14 App Router, React 19, TypeScript, responsive CSS design with zero heavyweight UI library bloat, and custom print media stylesheets for crisp 1-page PDF exports.
- **Backend API**: Python 3.12, FastAPI, Pydantic v2 for strict type safety and schema validation, and transaction-managed SQLAlchemy ORM.
- **Database**: Managed PostgreSQL on Render with automated runtime schema migrations.
- **PayPal Integration**: PayPal Orders v2 REST API implementing server-side order creation, buyer approval capture, idempotency validation, and milestone escrow states.
- **AI Engine**: Google Gemini API via structured schema completions for deterministic deliverables and exclusion extraction.
- **Testing & DevOps**: Automated end-to-end tests using Playwright, continuous deployment via Render Git integration, and programmatic API management.

---

### Challenges We Overcame
- **Strict One-Page Printing Constraint**: Generating a comprehensive legal certificate and dispute shield dossier that reliably prints onto exactly 1 physical page across Chrome, Firefox, and Safari required precision CSS layout budgeting and dynamic component compression.
- **Zero-Friction Hackathon Judging**: Ensuring judges could test the complete end-to-end flow in seconds without setting up sandbox accounts, signing in, or configuring API keys. We engineered the **1-Click Judge Showcase Bar** with instant role switching (`🧑‍💻 Freelancer View` ⇄ `👤 Client Mode`).
- **Idempotent PayPal State Machine**: Ensuring payment captures cannot be duplicated, replayed, or forged on the client side. The backend independently validates order states and locks contract versions upon payment settlement.

---

### Accomplishments That We're Proud Of
- 🏆 **100% Cloud-Deployed & Verified**: Fully operational on Render with live PostgreSQL, zero console errors, and sub-100ms response times.
- 🛡️ **Dispute Shield Innovation**: Built the first purpose-built chargeback rebuttal dossier tailored directly to PayPal's seller protection guidelines.
- 🚀 **1-Click Judge Experience**: Any hackathon judge can evaluate the full lifecycle—from AI extraction to milestone release—with zero setup.

---

### What We Learned
- How to structure PayPal Orders v2 captures to support multi-phase milestone escrows.
- How to write strict JSON-schema system prompts that extract ironclad contractual exclusions from ambiguous client requirements.

---

### What's Next for DealPilot AI
- **Automated Dispute Defense via PayPal Customer Disputes API**: Direct webhook listeners that automatically upload the DealPilot Dispute Shield Evidence Bundle to PayPal the moment a dispute is opened.
- **Smart Retainer Contracts**: Recurring monthly milestone releases with automated deliverables verification.
- **Multi-Party Collaboration**: Support for agency teams, sub-contractors, and enterprise procurement approvals.

---

## 🎬 2-Minute 40-Second Video Demo Script

> **Tip**: Record in 1080p full screen at `https://dealpilot-frontend-daol.onrender.com/?demo=judge`. Keep your video under 3:00 to satisfy Devpost requirements.

| Timestamp | Screen / Visual | Voiceover Audio |
| :--- | :--- | :--- |
| **0:00 – 0:25** | Landing page at `https://dealpilot-frontend-daol.onrender.com`. Show the "Agree on the work. Move forward together." headline and the **"⚡ Launch 1-Click Judge Showcase"** card. | *"Freelancers lose billions every year to scope creep, vague chat agreements, and PayPal chargebacks. DealPilot AI solves this by turning project conversations into clear, mutual agreements backed by PayPal milestone escrow and dispute protection. Let's launch the 1-click showcase."* |
| **0:25 – 0:55** | Click the button. Deal loads in Review state. Point out the 5-step lifecycle bar, AI-extracted deliverables, and out-of-scope exclusions. | *"Here is our active deal: a $3,500 Mobile App Redesign for Acme Payments Corp. DealPilot's AI extracted the exact deliverables, timeline, and explicit exclusions so there are no surprises later."* |
| **0:55 – 1:20** | Click **"Client Mode"** in the top Judge Demo Bar. Show the banner turn green and the unread approval notification appear. Scroll down and click **"Approve these exact terms"**. | *"Neither party can change terms unilaterally. Using our 1-click Judge Switcher, let's view this as the client. Alex Rivera reviews the proposal and clicks 'Approve these exact terms'. With dual consent recorded, the payment unlocks."* |
| **1:20 – 1:50** | Click **"Continue to PayPal"**. Show the Cross-Border FX Engine (click GBP, EUR, INR tabs) and the PayPal Checkout button. | *"In Step 5, clients can preview cross-border payments in their local currency like GBP or EUR, while the freelancer is guaranteed 100% of their USD payout with zero currency fluctuation risk."* |
| **1:50 – 2:15** | Show the settled payment view. Highlight the **PayPal Two-Phase Milestone Escrow** card (50% upfront released, 50% held). | *"Once completed, DealPilot activates Two-Phase Milestone Escrow: Phase 1's 50% deposit is released immediately to fund project kickoff, while Phase 2's 50% is securely held until final handoff."* |
| **2:15 – 2:35** | Click **"🛡️ Export PayPal Dispute Shield Bundle"**. Show the modal with cryptographic audit hash and out-of-scope exclusions. Then click **"View Certificate"** to show the signed 1-page document. | *"If a client ever files a dispute, DealPilot generates the PayPal Dispute Shield Evidence Bundle: an official dossier with cryptographic receipt hashes, dual consent logs, and out-of-scope clauses for instant PayPal Resolution Center defense. Plus, an official 1-page execution certificate."* |
| **2:35 – 2:45** | Return to dashboard. Show the verified paid deal with badge. | *"DealPilot AI: From conversation to mutual agreement to dispute-proof PayPal payment. Thank you!"* |

---

## ✅ Final Pre-Submission Checklist

- [x] Cloud backend deployed on Render (`https://dealpilot-backend-ghqy.onrender.com`)
- [x] Cloud frontend deployed on Render (`https://dealpilot-frontend-daol.onrender.com`)
- [x] Zero-setup judge URL verified (`https://dealpilot-frontend-daol.onrender.com/?demo=judge`)
- [x] Database migration applied (`milestones` column on Render PostgreSQL)
- [x] End-to-end client approval and payment flow verified with Playwright
- [x] PayPal Dispute Shield Evidence Bundle modal verified and captured
- [x] 1-Page Official Execution Certificate modal verified and captured
- [x] Public GitHub repository accessible with MIT License
- [ ] Record and upload screen demo video to YouTube (under 3 minutes)
- [ ] Paste submission fields into [paypalaihackathon.devpost.com](https://paypalaihackathon.devpost.com)
