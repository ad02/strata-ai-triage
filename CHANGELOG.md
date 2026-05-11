# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Bootstrap: Next.js 16.2.6 (App Router) + React 19.2 + TypeScript 5 + Tailwind v4
- Bootstrap: shadcn/ui with 12 components (badge, button, card, dialog, input, label, scroll-area, separator, skeleton, sonner, textarea, tooltip)
- Bootstrap: Runtime deps `@google/genai` v2.0.1 (Gemini), `zod` v4 (schema validation), `zustand` v5 (state)
- Bootstrap: Vitest v4 for unit tests; npm scripts `test` and `test:watch`
- Bootstrap: `.env.example` documenting required `GEMINI_API_KEY`
- Bootstrap: `vitest.config.ts` with `@/*` import alias matching tsconfig

### Domain layer
- `lib/schema.ts` — Zod schema (single source of truth) with 9 fields: classification, classification_confidence, classification_reasoning, urgency, geography, route_to, recommended_action, suggested_reply (subject + body), flags. Plus `validateBusinessRules()` used by the AI self-correction loop.
- `lib/team.ts` — static team directory mapping `route_to` roles to real team members from the public team page (David Lin, Ross Competente). Documents the small-firm rationale where multiple roles map to the founder.
- `lib/sample-enquiries.ts` — 8 seeded enquiries covering the classification × flag matrix plus 1 adversarial prompt-injection test.

### AI core
- `lib/few-shot.ts` — 4 worked input/output examples (clean buyer / vague / out-of-scope / high-value confidential). Each is one *pattern* — the modal path plus the three production failure modes.
- `lib/prompt.ts` — `systemInstruction` exported as a single `const`. Sections: domain context (M&A brokerage, not strata mgmt), adversarial-input handler (positioned early to defend against injection), classification rules, confidence calibration, urgency, geography, routing, flags, reply drafting (Australian English), reasoning, output instructions. Few-shots appended last so they're fresh in attention when generating.
- `lib/gemini.ts` — `@google/genai` v2 wrapper. Builds `responseSchema` from Zod enum options (single source of truth). Includes:
  - **AI self-correction loop**: 1 retry if Zod fails OR `validateBusinessRules()` flags a violation; sends Gemini a corrective note describing the specific issue.
  - Network retry: 1 retry on rate_limit/5xx with 1.5s backoff.
  - 20s `AbortController` per call.
  - Privacy-aware structured logging (metadata only, never enquiry content).
  - `probeGemini()` lightweight liveness check used by /api/health.
- `app/api/analyze/route.ts` — POST handler. Validates body (non-empty, ≤10k chars), calls `analyzeEnquiry()`, maps error codes to HTTP status (400/413/429/500/502/503/504).
- `app/api/health/route.ts` — GET handler. Returns 200 if Gemini probe succeeds, 503 if degraded. Drives the dashboard's red/green health indicator.

### Caching layer
- `scripts/precache-seeds.ts` — one-shot script that runs each seeded enquiry through `analyzeEnquiry()` and writes results to `lib/seeded-analyses.ts`. Throttled to 13s between calls (free tier is 5 RPM on `gemini-2.5-flash`).
- `lib/seeded-analyses.ts` — generated cache, 9 analyses. Dashboard renders these instantly on click; only user-pasted enquiries hit Gemini live. Documented in README.
- npm script `cache-seeds`. Dev deps: `tsx` (TypeScript runner) and `dotenv`.

### Live-spike validation results (Phase I)
- `@google/genai` v2 SDK works correctly with our nested `responseSchema` (no `$ref` issues).
- All 9 seeded enquiries returned valid JSON parsed cleanly by Zod.
- The adversarial prompt-injection enquiry was correctly classified as `general_question`, urgency `low`, route `intake`, with `out_of_scope` flag — system instruction held.
- Self-correction loop wired correctly (didn't trigger on these — outputs were clean first try).
- Network retry triggered once (enq-006, attempts=2) and recovered cleanly.
- Average latency ~5s per enquiry. Free tier 5 RPM is the binding constraint, not latency.

### State + tests
- `lib/store.ts` — Zustand store. Holds `enquiries`, `selectedId`, `analyses`, `statuses`, `errors`. Initial state hydrates seeded enquiries with their pre-cached analyses (status="done") so the dashboard renders instantly. Selectors for the currently-selected enquiry's data.
- `lib/use-analyze.ts` — `useAnalyze()` hook. Wraps fetch to /api/analyze, drives store state, maps server error codes to friendly user-facing messages.
- `tests/schema.test.ts` — 7 tests on Zod schema (well-formed, confidence range, unknown enum, missing field, empty flags, geography "unspecified").
- `tests/business-rules.test.ts` — 6 tests on `validateBusinessRules()` (clean, low-confidence rule, out-of-scope rule, high-value-lead routing rule).
- `tests/team.test.ts` — 4 tests on team directory (every role mapped, getTeamMember lookup, fallback for unknown role, no real PII).
- All 17 tests passing.

### Notes
- Next.js 16 (released ahead of original Next.js 15 plan) — Turbopack is now default; `next lint` removed in favor of direct `eslint` invocation. No code changes needed for our use case.
- Replaces a prior wrong-domain prototype (generic strata management) — the new build is tailored to **Strata Business Brokers**, an Australian M&A brokerage. See git history (`git log --all`) for prior work.
