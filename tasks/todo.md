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
- [x] N — README written: tailoring section, quick-start, architecture diagram, AI design rationale, verbatim system instruction, few-shot rationale, calibration honesty, self-heal three-layers, error handling tables, privacy, tests, known limitations (incl. 20 RPD quota), production roadmap, trade-offs, tech stack, team-names note

## Phase O — Deploy
- [/] O — Deferred to user (account-bound). Quick guide: push to GitHub → import to Vercel → add `GEMINI_API_KEY` env var → done.

## Phase P — Verify
- [x] P — Verified: 17/17 tests pass, `npm run build` succeeds, page loads 200, health endpoint returns actual Gemini probe status, adversarial test held during live spike. Only the live "+ New Enquiry" path is currently rate-limited (free-tier 20 RPD); cached seeded enquiries work fully.

## Review

**Done in this session:**
- 9 commits on master (`37c3435` → `fd4f706`)
- Full Next.js 16 + Tailwind v4 + shadcn dashboard with 12 components, error boundary, health indicator, theme switcher
- Gemini 2.5 Flash integration via `@google/genai` v2 with structured output (responseSchema enforced)
- AI self-correction loop (Zod + business rules → corrective retry)
- Network retry layer (1.5s backoff on 429/5xx)
- Frontend error boundary
- 17 tests across schema, business-rules, team
- 9 cached analyses including adversarial prompt-injection test (system instruction held)
- Comprehensive README hitting every rubric + bonus criterion

**User's remaining work:**
1. Browse the demo at http://localhost:3001 (dev server still running)
2. Rotate the API key (was pasted in chat)
3. Push to GitHub
4. (Optional) Deploy to Vercel

## Review

_(Filled in when work is complete.)_
