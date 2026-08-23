# Aura Mail — Live Status

_Update this when you start, pause, or finish a session — and always as part of your PR. This is a status board, not documentation (that's `roadmap.md`)._

---

## 🔨 In Progress

| Phase | Feature | Owner | Branch | Status |
|---|---|---|---|---|
| 0 | Repo & infra foundation | TBD | `phase-0-setup` | Not started |

## ✅ Done & Merged

_(none yet — project starts from Phase 0)_

## ⏳ Waiting / Blocked

- Phases 1–12 — all blocked on Phase 0 (new repo, new Supabase project, fresh keys)
- See `roadmap.md` Section 6 for the full branch dependency table

## ⚠️ Known issues / things to flag for others

- `hooks/useGroups.ts` still references old `groups`/`group_members` table names — schema was renamed to `organizations`/`organization_members`. Needs an agent-assisted rename pass. Group/circle creation will fail until this is fixed.

## How to use this file

1. Before starting work, check "In Progress" — see what's active and by whom
2. Update your own row when you start, pause, or finish
3. Move your row to "Done & Merged" once your PR is approved and merged
4. If you hit something another branch might collide with, add it to "Known issues" immediately — don't wait until your PR
5. Keep entries short — one line per item, this file should take 15 seconds to read