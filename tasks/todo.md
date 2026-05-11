# Tasks — Strata Business Brokers AI Triage Prototype

Plan reference: `~/.claude/plans/qa-it-goofy-pond.md`

## Phase A — Clean checkpoint
- [x] Commit deletion of prior wrong-domain prototype (commit `37c3435`)

## Phase B — Bootstrap
- [x] B.0 — `npx create-next-app` (Next.js 16.2.6 + TS + Tailwind v4 + App Router)
- [x] B.1 — Install `@google/genai`, `zod`, `zustand`, `vitest`
- [x] B.2 — `npx shadcn init` + add 12 components
- [x] B.3 — `package.json` test scripts, `vitest.config.ts`, `.env.example`, `CHANGELOG.md`, this `tasks/todo.md`
- [ ] B.4 — Commit Phase B as one bootstrap checkpoint

## Phase C — Schema & domain
- [ ] C — `lib/schema.ts` (Zod, 9 fields incl. geography)
- [ ] D — `lib/team.ts` (David Lin, Ross Competente, role mapping)
- [ ] E — `lib/sample-enquiries.ts` (8 + 1 adversarial)

## Phase F — AI integration
- [ ] F — `lib/prompt.ts` + `lib/few-shot.ts` (4 examples)
- [ ] G — `lib/gemini.ts` (`@google/genai` wrapper + AI self-correction loop)
- [ ] H — `app/api/analyze/route.ts` (POST + retry/timeout)
- [ ] H.1 — `app/api/health/route.ts` (Gemini connectivity probe)
- [ ] I — Spike Gemini call live (validate `responseSchema` accepts our shape)
- [ ] J — Pre-cache seeded analyses → `lib/seeded-analyses.ts`

## Phase K — State + tests
- [ ] K — `lib/store.ts` (Zustand) + `lib/use-analyze.ts`
- [ ] L — Tests (schema, api with mocked Gemini, team mapping, self-correction loop)

## Phase M — UI
- [ ] M — Dashboard page + 9 components + error boundaries + health indicator

## Phase N — Docs
- [ ] N — README (verbatim prompt, error table, production roadmap, trade-offs, privacy, calibration honesty, self-heal section)

## Phase O — Deploy
- [ ] O — Vercel deploy + `GEMINI_API_KEY` env var + smoke test

## Phase P — Verify
- [ ] P — All 13 acceptance criteria from plan

## Review

_(Filled in when work is complete.)_
