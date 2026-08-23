# Aura Mail — Live Status

_Update this when you start, pause, or finish a session — and always as part of your PR. This is a status board, not documentation (that's `roadmap.md`)._

---

## 🔨 In Progress

_(nothing currently active — pick a Phase 1–3 branch and add yourself here when you start)_

## ✅ Done & Merged

| Phase | Feature | Notes |
|---|---|---|
| 0 | Repo & infra foundation | Repo created with fresh git history; Supabase project + `profiles`/`organizations`/`organization_members` schema live (migration committed at `supabase/migrations/0001_init.sql`); Upstash Redis attached via Vercel Storage Marketplace; Gemini + Safe Browsing keys wired; branch protection on `main` live; verified end-to-end both locally and on the deployed Vercel URL |

## ⏳ Waiting / Blocked

- Phases 1–12 are all unblocked and ready to start — see `roadmap.md` Section 5 for the branch dependency table

## ⚠️ Known issues / things to flag for others

- **For Phase 1:** several Scam Shield branding items are still live in `app/page.tsx` — the stacked `SCAM`/`SHIELD` hero title (needs real layout redesign, not a text swap), `shield-logo.png` + its alt text, the `"Shield Account"` fallback name, the "Copy Alert to Share" feature's hardcoded `Scam Shield Analysis` / `scamshield.vercel.app` share text, and "Scam Radar" feature naming. See `roadmap.md` Phase 1 for the full list. Not blocking — flagged so it isn't lost.

## How to use this file

1. Before starting work, check "In Progress" — see what's active and by whom
2. Update your own row when you start, pause, or finish
3. Move your row to "Done & Merged" once your PR is approved and merged
4. If you hit something another branch might collide with, add it to "Known issues" immediately — don't wait until your PR
5. Keep entries short — one line per item, this file should take 15 seconds to read