# Aura Mail 🔍✉️

An AI-powered email threat detection, geolocation, and forensic intelligence platform — combining semantic/content analysis, authentication forensics, IP hop geolocation, and domain intelligence into a single risk score, a plain-language attack narrative, and an exportable forensic report.

Built for **Smart India Hackathon — PS 26106: AI-Powered Email Threat Detection, GeoLocation and Forensic Intelligence Platform** (AICTE, Cyber Security Cell).

Full build plan and phase-by-phase status: [`roadmap.md`](./roadmap.md) · [`STATUS.md`](./STATUS.md)

---

## What it does (target state — build in progress)

- **Paste raw email source or upload a `.eml` file** — the system parses the full technical envelope, not just the rendered text
- **Multi-signal forensic analysis:**
  - Semantic/content analysis via Gemini reasoning + embedding-based pattern matching against a curated library of email-specific scam scripts (BEC, invoice fraud, executive impersonation, credential harvesting)
  - Authentication forensics — SPF/DKIM/DMARC verdicts (parsed from `Authentication-Results`), `Received:` chain reconstruction, Reply-To/Return-Path mismatch detection
  - IP hop extraction and geolocation tracing across the mail relay path
  - Domain intelligence — WHOIS/RDAP lookup, newly-registered-domain flagging, homograph/lookalike-domain detection
  - Google Safe Browsing link verification (inherited, unchanged)
- **Sub-scores, not a black box** — content-trust, header-integrity, and domain-trust reported separately, feeding one final risk score
- **Synthesized attack narrative** — signals stitched into a single plain-language sentence explaining the likely attack (e.g. "a domain registered four days ago is impersonating your CFO to request an urgent wire transfer")
- **Attachment IOC extraction** — attachment hashes (SHA-256) surfaced as indicators of compromise
- **Exportable forensic PDF report** — header breakdown, auth results, hop trace, domain intel, IOCs, narrative, recommended escalation — built for institutional/incident-response use, not individual complaint filing
- **Organizational accounts & campaign correlation** — invite-only org circles where members flag and correlate emails sharing sending infrastructure, not just similar wording
- **Secondary mode: SMS/WhatsApp scam check** — the original message/screenshot analysis engine, kept as an additional channel rather than the primary pitch

---

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- A Gemini API key (`@google/genai`)
- A Google Cloud API key with Safe Browsing enabled (optional — degrades gracefully)
- A Supabase project for Postgres & Auth
- Upstash Redis instance (for fast distributed KV report storage and circle clustering)
- A geolocation API for IP hop lookups (default target: ip-api.com — no key required for low volume; see roadmap for fallback options)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/aura-mail.git
cd aura-mail
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in:
```env
# Gemini API Key (Required for AI detection)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Safe Browsing API Key (Optional)
SAFE_BROWSING_API_KEY=your_safe_browsing_key_here

# Supabase Credentials (Required for auth & organizations)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Upstash Redis REST Credentials (Required for circle reports KV storage)
REDIS_KV_REST_API_URL=https://your-redis.upstash.io
REDIS_KV_REST_API_TOKEN=your_upstash_redis_token
```

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Tech stack

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS · Gemini API (`@google/genai`) · Google Safe Browsing Lookup API · Supabase (Postgres + Auth) · Upstash Redis · Vercel

**New for this project:**
- `mailparser` — raw email/`.eml` header and body parsing
- Geolocation API integration for IP hop tracing
- RDAP-over-HTTPS for domain/WHOIS intelligence
- `@react-pdf/renderer` (or `pdf-lib`) — forensic PDF report generation

---

## Status

Phase 0 (Infra), Phase 1 (UI & Positioning Reframe, Auth Modernization), and Phase 1.5 (API Resilience & UX) are complete. See [`STATUS.md`](./STATUS.md) for what's currently in progress, and [`roadmap.md`](./roadmap.md) for the full phase-by-phase plan.