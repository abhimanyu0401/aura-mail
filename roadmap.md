# Aura Mail — Project Roadmap

**Problem Statement:** SIH PS 26106 — AI-Powered Email Threat Detection, GeoLocation and Forensic Intelligence Platform (AICTE, Cyber Security Cell)
**Status:** Pre-build. This roadmap starts from Phase 0 — nothing shipped yet.

**Repository:** `aura-mail` starts with a completely fresh git history.

---

## 1. Elevator Pitch

Aura Mail ingests raw email (pasted source or `.eml` upload) and produces a hybrid forensic verdict combining semantic/content analysis (Gemini reasoning + embedding-based matching against curated phishing/BEC scripts), authentication forensics (SPF/DKIM/DMARC, `Received:` chain reconstruction), IP hop geolocation tracing, and domain intelligence (WHOIS/RDAP, lookalike-domain detection) — merged into one risk score with separate trust sub-scores, a synthesized plain-language attack narrative, and an exportable forensic PDF report. Organizational trust circles let institutional members correlate and confirm campaigns hitting multiple people from shared sending infrastructure.

---

## 2. Current Status

**Phases 0, 1, and 1.5 are complete.**
- Repo, Supabase project + schema, Redis KV, and all API keys are live.
- Complete UI & positioning reframe delivered with custom Aura Mail navigation, brand assets (`aura-mail-logo.png`, `aura-network-logo.png`, `landing-map.png`), neumorphic authentication modal, and strict Supabase auth.
- Phase 2 (Email-shaped content engine) is ready to start. Update this section as further phases complete — see `STATUS.md` for the live day-to-day board.

---

## 3. Build Plan

### 🎯 Pre-Internal Target (Days 1–7)

#### Phase 0 — Repo & infra foundation (Owner: TBD) ✅ Complete
Checklist:
- [x] Create `aura-mail` repo with a fresh `git init`
- [x] Create a dedicated Supabase project; generate fresh publishable/secret keys
- [x] Design and run the initial schema (`profiles`, `organizations`, `organization_members`, RLS policies, `create_organization_with_admin` / `lookup_organization_by_invite_code` RPCs); saved to `supabase/migrations/0001_init.sql` and committed
- [x] Create the Vercel project and attach Upstash Redis via Storage Marketplace; env vars synced locally with `vercel env pull`
- [x] Gemini and Safe Browsing API keys generated and wired
- [x] Update `.env.example` with the full variable set
- [x] Fix `hooks/useGroups.ts` → `hooks/useOrganizations.ts` and its usage in `app/page.tsx` to match the `organizations`/`organization_members` schema (renamed completely, not just the broken calls — see Section 5 note below)
- [x] Scaffold `README.md` / `roadmap.md` / `STATUS.md`
- [x] Branch protection on `main`: PR required, ≥1 approval from someone other than the author, no self-merge, no bypass list
- [ ] New folder convention: `lib/email-forensics/` for header/geo/domain modules, kept separate from existing content-analysis code (`lib/scam-patterns.json`, embedding logic) — deferred naturally to when Phase 3 adds its first file there, since Git doesn't track empty folders anyway

#### Phase 1 — UI & positioning reframe (Owner: TBD) ✅ Complete
Checklist:
- [x] Landing hero reframed around institutional email-forensics and threat intelligence
- [x] Email input & analysis positioned as the primary workflow
- [x] Modern floating navbar component with active section indicator and account dropdown
- [x] Replace legacy Scam Shield assets with official Aura Mail branding (`aura-mail-logo.png`, `aura-network-logo.png`, `landing-map.png`)
- [x] Neumorphic sliding auth modal (`AuthModal.tsx`) with genuine Supabase email/password auth and real error messaging
- [x] Remove demo user bypasses, localStorage mocks, and unconfigured social login fallbacks
- [x] Responsive layout and styling pass across desktop, tablet, and mobile breakpoints

#### Phase 1.5 — API Resilience & UX Improvements (Owner: TBD) ✅ Complete
Checklist:
- [x] Implement exponential backoff retry logic for Gemini API calls to handle `503 Service Unavailable` high demand spikes
- [x] Add frontend UI state to inform users when analysis takes longer than 5 seconds

#### Phase 2 — Email-shaped content engine ("quick wins") (Owner: TBD)
- Rule-based flag vocabulary updated for email fraud (`wire transfer`, `invoice`, `gift card`, `confidential`, `urgent payment`, etc.) replacing the inherited OTP/UPI-shaped SMS flags
- New curated corpus of 15–25 email-specific scam scripts (BEC, invoice fraud, executive impersonation, credential harvesting), embedded via the inherited `precompute-embeddings.ts` pattern
- Gemini reasoning prompt tuned to name email-specific red flags (display-name spoofing, reply-to mismatch, urgency + wire-transfer combinations)
- **This phase is the internal-round demo core.** Positioning: "content-analysis engine is built and working; forensic header/geo/domain layer is in active development" (Phases 3–4 below)

#### Phase 3 — Raw email ingestion pipeline (Owner: TBD — stretch for pre-internal, firm target immediately after)
- Accept `.eml` upload and/or raw pasted email source (headers + body)
- Parse via `mailparser`: structured headers, body, attachment list
- `NOT_AN_EMAIL` guard, equivalent to the inherited `NOT_A_MESSAGE` / `NO_TEXT_FOUND` checks

**Architecture decision — new dedicated route, not an extension of `/api/check`:** email analysis gets its own endpoint, `app/api/analyze-email/route.ts`. The inherited `app/api/check/route.ts` stays as-is, serving only the secondary SMS/message/screenshot mode. Reasoning:
- Different input contract entirely (raw email source/`.eml` vs. plain text/image) — branching one route on input type would tangle two unrelated request shapes together
- Different, heavier concurrent-signal set (header parse, geolocation, domain/RDAP lookups vs. just Safe Browsing) — keeping them separate avoids the email path's extra latency/failure modes leaking into the simpler, already-stable SMS path
- Matches the existing codebase's own convention of resource-specific routes (e.g. `app/api/circles/[circleId]/report/route.ts` is its own endpoint rather than folded into a generic handler)
- Makes Phase 12 rate limiting straightforward to tune per-route with different budgets, since email analysis is inherently more expensive (multiple external API calls) than a text-only check
- Keeps `/api/check` low-risk and untouched, which matters since that code is already proven in production for the SMS/message mode

#### Phase 4 — Header & authentication forensics (Owner: TBD — stretch teaser for internal)
- Parse the `Authentication-Results` header for SPF/DKIM/DMARC verdicts — **do not** re-implement cryptographic verification; parse what the receiving mail server already computed
- Reconstruct the `Received:` chain top-down
- Detect Reply-To / Return-Path mismatches
- **Stretch goal:** even a minimal working teaser (SPF/DKIM/DMARC chips on one sample email) shown live at the internal is worth more than describing it on a slide — prioritize this over polish elsewhere if time is tight

---

### 🔵 Internal Round Checkpoint (~Day 7)
**Target demo state:** Phases 0–2 fully working. Phase 3 ideally functional. Phase 4 shown as in-progress, ideally with a partial working teaser. Be upfront in the pitch about what's built vs. planned — internal rounds reward a credible working core plus a believable plan, not full PS coverage.

---

### 🎯 Post-Internal → Pre-Finals Target (Days 8–30)

#### Phase 5 — IP hop extraction & geolocation trace (Owner: TBD)
- Extract IPs from the `Received:` chain, filter private/internal ranges
- Geolocate each public hop (default: ip-api.com — free, no key, watch rate limits; ipinfo.io as a paid fallback if needed)
- Flag VPN/proxy/hosting-provider IPs where the API surfaces that signal
- Render a hop-by-hop trace visualization on the frontend

#### Phase 6 — Domain intelligence + homograph detection (Owner: TBD)
- RDAP lookup on sender domain (registrar, creation date) — use RDAP-over-HTTPS, not raw WHOIS/port 43, for reliability on serverless
- Flag newly-registered domains (e.g. <30 days old) sending urgent/financial requests
- **Innovation — homograph/lookalike-domain detection:** flag sender domains using Unicode-confusable characters (e.g. Cyrillic "а" standing in for Latin "a") or near-miss spellings against a small curated list of commonly-impersonated domains

#### Phase 7 — Hybrid forensic risk engine + sub-scores + narrative (Owner: TBD)
- Extend the inherited concurrent-signal pattern (`Promise.all` merging multiple checks) with new header/geo/domain branches alongside content analysis and Safe Browsing
- **Innovation — sub-scores instead of one black-box number:** surface separate content-trust, header-integrity, and domain-trust components feeding the final score
- **Innovation — synthesized attack narrative:** one additional Gemini call stitches all signals into a single plain-language sentence (e.g. "a domain registered four days ago is impersonating your CFO to request an urgent wire transfer") rather than a bare list of flags

#### Phase 8 — Attachment IOC extraction (Owner: TBD)
- `mailparser` already surfaces attachment metadata — hash attachments (SHA-256), list as indicators of compromise
- Extend the verdict/report schema to carry IOC data

#### Phase 9 — Forensic PDF report export (Owner: TBD)
- Genuinely new capability — no PDF generation exists in the inherited codebase
- `@react-pdf/renderer` (or `pdf-lib`) to produce a structured report: header breakdown, auth results, hop trace, domain intel, IOCs, synthesized narrative, recommended escalation
- Built for incident-response/legal use, not individual complaint filing — a formal escalation artifact, not a chat-window summary

#### Phase 10 — Organizational accounts & campaign correlation (Owner: TBD)
- New Supabase schema in Aura Mail's own project: `profiles`, `organizations`/`groups`, `reports` (extended with `sender_ip`, `sender_domain`)
- Correlate reports by shared sending infrastructure, not just text-embedding similarity
- Reuses the inherited Redis-backed reporting pattern; new correlation logic

#### Phase 11 — Campaign graph view (stretch)
- Force-directed graph linking correlated reports/domains/IPs across an organization
- Explicitly optional — only pursue once Phases 0–10 are solid and tested. The PS explicitly calls out "graph-based relationship analysis," so this is a strong differentiator if time allows, but finals success shouldn't depend on it

#### Phase 12 — Reliability & analyst-facing UX polish (Owner: TBD, split backend/frontend)
- Rate limiting on analysis endpoint(s)
- Verdict UI reframed for a security-analyst/institutional persona rather than an elderly/citizen framing
- Responsive testing across breakpoints

#### Phase 13 — Regression, merge, redeploy (whole team)
- Full manual regression across every phase
- Merge all feature branches to `main` in sequence, redeploy, verify the live URL end-to-end — budget real time here, this is where parallel-work bugs surface

#### Phase 14 — Demo materials refresh (Owner: TBD + primary builder)
- New demo video, updated presentation deck, fresh screenshots of every major flow

#### Phase 15 — Presentation & Q&A rehearsal (whole team)
- Practice the live demo end-to-end, including recovery if something breaks live
- Prepare answers for: why RDAP over raw WHOIS; why parse `Authentication-Results` instead of re-verifying SPF/DKIM cryptographically; why infrastructure-based correlation over pure text similarity; and why the platform targets an institutional/analyst audience rather than individual consumers

#### Final buffer
- Live-URL sanity check, rest before demo day

---

## 4. Deliberately Deferred — Talking Points Only, Unless Ahead of Schedule
- **True live-inbox integration** (Gmail API push / IMAP monitoring) — manual `.eml`/paste ingestion is the demo mode; live monitoring is a credible "next step" to mention, not something to build under time pressure
- **Cross-organization graph correlation** beyond a single org's circle
- **Reporter trust scoring** (confirm/deny accuracy weighting future reports)

---

## 5. Team Git Workflow

`main` requires a PR and ≥1 approval from someone other than the author; no self-merge; no bypass list.

**Phase owners are intentionally left as `TBD` throughout this document** — the team is deciding who takes each phase at kickoff time rather than pre-assigning now. Whoever picks up a phase should fill in their name in both this file and `STATUS.md` before opening a branch, so "who's doing what" stays visible to the rest of the team.

### Checklist — before starting any phase
- [ ] `git checkout main && git pull`
- [ ] Check `STATUS.md` — see what's currently in progress and by whom
- [ ] Confirm the correct branch name for your phase
- [ ] Test locally before committing
- [ ] Push and open a PR — direct pushes to `main` are blocked
- [ ] Get it approved by someone else before merging
- [ ] Update `STATUS.md` as part of your PR, then tell the team so everyone pulls `main`

### Branches
| Branch | Phase | Owner | Status |
|---|---|---|---|
| `phase-0-setup` | 0 | — | ✅ Done, merged to `main` |
| `phase-1-ui-reframe` | 1 | TBD | Ready to start |
| `phase-2-content-engine` | 2 | TBD | Ready to start |
| `phase-3-ingestion` | 3 | TBD | Ready to start |
| `phase-4-header-forensics` | 4 | TBD | Blocked on Phase 3 |
| `phase-5-geo-trace` | 5 | TBD | Blocked on Phase 4 |
| `phase-6-domain-intel` | 6 | TBD | Blocked on Phase 4 |
| `phase-7-risk-engine` | 7 | TBD | Blocked on Phases 5–6 |
| `phase-8-ioc-extraction` | 8 | TBD | Blocked on Phase 3 |
| `phase-9-pdf-report` | 9 | TBD | Blocked on Phase 7 |
| `phase-10-org-correlation` | 10 | TBD | Blocked on Phase 0 |
| `phase-11-graph-view` | 11 | TBD | Stretch — blocked on Phase 10 |
| `phase-12-reliability-ux` | 12 | TBD | Independent, start any time |

**Shared-file conflict warning:** header forensics, geo trace, domain intel, and the risk engine all likely touch the same API route(s). Merge one at a time and pull `main` between merges — don't leave multiple diverging for days.

---

## 6. Tech Stack Additions

- `mailparser` — raw email/`.eml` parsing
- Geolocation API client (ip-api.com default, ipinfo.io fallback)
- RDAP-over-HTTPS client for domain intelligence
- `@react-pdf/renderer` or `pdf-lib` — PDF report generation
- Supabase project: tables `profiles`, `organizations`, `organization_members` — `reports` planned for Phase 10, extended with `sender_ip`/`sender_domain`
- Existing stack unchanged otherwise: Next.js, React, TypeScript, Tailwind, Gemini API, Upstash Redis, Google Safe Browsing, Vercel

---

## 7. Evaluation Focus Mapping

*(Generic hackathon judging categories — replace with SIH's actual published rubric if available.)*

- **Novelty:** multi-layer forensic correlation (content + auth + geo + domain) + organizational campaign correlation + a direct escalation artifact (forensic PDF report), not just a spam filter
- **Technical Execution:** header/auth parsing, geolocation, domain intelligence, hybrid scoring, relational data modeling, graceful degradation — demonstrable live, not just described
- **Impact:** institutional email-fraud defense with a forensic paper trail usable by security teams and investigators
- **Presentation:** live demo judges can test directly; confident, specific answers on every architectural decision, including how this differs from prior work