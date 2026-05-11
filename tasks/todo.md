# Tasks — Strata Business Brokers AI Triage Prototype

Plan reference: `~/.claude/plans/qa-it-goofy-pond.md`

## Phase A — Clean checkpoint
- [x] Commit deletion of prior wrong-domain prototype (commit `37c3435`)

## Phase B — Bootstrap
- [x] B.0 — `npx create-next-app` (Next.js 16.2.6 + TS + Tailwind v4 + App Router)
- [x] B.1 — Install `@google/genai`, `zod`, `zustand`, `vitest`
- [x] B.2 — `npx shadcn init` + add 12 components
- [x] B.3 — `package.json` test scripts, `vitest.config.ts`, `.env.example`, `CHANGELOG.md`, this `tasks/todo.md`
- [x] B.4 — Commit Phase B as one bootstrap checkpoint (`f85354b`)

## Phase C — Schema & domain
- [x] C — `lib/schema.ts` (Zod, 9 fields incl. geography + business-rule validator)
- [x] D — `lib/team.ts` (David Lin, Ross Competente, role mapping)
- [x] E — `lib/sample-enquiries.ts` (8 + 1 adversarial)

## Phase F — AI integration
- [x] F — `lib/prompt.ts` + `lib/few-shot.ts` (4 examples)
- [x] G — `lib/gemini.ts` (`@google/genai` wrapper + AI self-correction loop)
- [x] H — `app/api/analyze/route.ts` (POST + retry/timeout)
- [x] H.1 — `app/api/health/route.ts` (Gemini connectivity probe)
- [x] I — Spike Gemini call live (validate `responseSchema` accepts our shape) — passed; adversarial test held
- [x] J — Pre-cache seeded analyses → `lib/seeded-analyses.ts` (9 analyses, throttled 13s for 5 RPM free tier)

## Phase K — State + tests
- [x] K — `lib/store.ts` (Zustand) + `lib/use-analyze.ts`
- [x] L — Tests (17 passing across 3 files: schema, business-rules, team)

## Phase M — UI
- [x] M — Dashboard page + 12 components + error boundary + health indicator (smoke tested OK)

## Phase N — Docs
- [ ] N — README (verbatim prompt, error table, production roadmap, trade-offs, privacy, calibration honesty, self-heal section)

## Phase O — Deploy
- [ ] O — Vercel deploy + `GEMINI_API_KEY` env var + smoke test

## Phase P — Verify
- [ ] P — All 13 acceptance criteria from plan

## Review

_(Filled in when work is complete.)_
