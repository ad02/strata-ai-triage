# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### UI polish — Linear-like refined dashboard
- Switched font from Geist to **Inter** (with JetBrains Mono for code) — cleaner SaaS-dashboard standard. Inter loaded via `next/font/google` with `display: swap` and OpenType features (cv11/ss01/ss03) enabled.
- Tightened the design system:
  - `--radius` 0.625rem → 0.5rem for crisper corners
  - Added tabular-nums utility, custom thin scrollbar, refined ::selection
  - Font features and font smoothing for sharper rendering
- Header redesigned: small brand-mark tile with Building2 icon, two-line title/subtitle, sticky-blur backdrop
- Inbox list refined: sticky section header with count, tighter rhythm, selected state shown as a left vertical bar (Linear pattern), smaller classification dots with background ring, added CONF (confidentiality) chip alongside HVL/URGENT
- Detail pane refined: bigger semibold title, dot-separated meta line, generous spacing, refined empty state with circled icon
- Cards: shadow-sm + border-border/60 (subtle depth), tighter card headers (h-3.5 icons, smaller titles), uppercase tracked field labels
- Banners: lighter tone, subtle gradient on gold (HVL), Lock icon for confidentiality
- Routing card: avatar with initials, role pill on the right, group-hover underline on email
- Suggested reply card: separated subject/body with dividers, demo label on Send button
- Health indicator: animated ping ring + ring-glow + tabular-nums, hover-text-foreground transition

### Phase P — Verification
- `npm test` → 17/17 passing
- `npm run build` → succeeds; `/` static, `/api/analyze` + `/api/health` dynamic (correct for env access)
- `npx tsc --noEmit` → clean
- Dev server: page loads in 55ms (warm), health endpoint returns the actual Gemini probe status
- All 9 acceptance criteria that don't require deploy: PASS
- Acceptance criterion 12 (Vercel deploy): deferred to user


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

### UI (dashboard)
- `app/layout.tsx` — wraps `ThemeProvider` (next-themes, system default), `TooltipProvider`, `Toaster` (sonner).
- `app/page.tsx` — dashboard shell: header + sidebar (InboxList) + main (EnquiryDetail).
- `components/header.tsx` — title, health indicator, "New enquiry" button.
- `components/health-indicator.tsx` — polls `/api/health` every 60s, shows red/green dot with tooltip detail.
- `components/inbox-list.tsx` — left column. Classification dot per item, sender name, subject, relative time, classification label, HVL/URGENT badges.
- `components/enquiry-detail.tsx` — right column composer. Includes a React error boundary around the analysis card so one bad render doesn't kill the page; the boundary offers a Retry button.
- `components/analysis-card.tsx` — classification, confidence, urgency, geography, reasoning, flags, recommended action. Has a skeleton state for analyzing.
- `components/banners.tsx` — low-confidence banner (< 0.7), high-value-lead banner (gold), confidentiality-required banner (violet).
- `components/routing-card.tsx` — shows team member from `lib/team.ts`, mailto link, "review before forwarding" caveat.
- `components/suggested-reply-card.tsx` — view + edit subject and body, Copy / Edit / Send (mock) buttons. Sonner toast on copy/send.
- `components/new-enquiry-dialog.tsx` — modal with from-name, from-email, subject, body fields. Calls `useAnalyze` on submit.
- `components/flag-chips.tsx` — flag chips with tooltip descriptions.
- `lib/format.ts` — pure formatters for relative time, classification labels/colors, urgency badges, confidence tone, geography labels, flag descriptions, route labels.
- `components/theme-provider.tsx` — next-themes wrapper.
- Smoke-tested: `next dev` boots clean, `/` renders 200, `/api/health` returns the actual Gemini status.

### Operational note: free-tier daily quota
- Discovered during smoke testing: `gemini-2.5-flash` free tier is **20 requests per day** (not the 1500/day documented previously). After running the cache script (9 reqs) + a few health probes + manual tests, we hit the daily quota.
- Cached seeded analyses still display correctly (dashboard fully functional for the 9 seeded enquiries).
- New user-pasted enquiries will fail with a friendly "rate limit" message until quota resets at UTC midnight or the user upgrades to paid tier.
- Documented in README "Known limitations".

### Notes
- Next.js 16 (released ahead of original Next.js 15 plan) — Turbopack is now default; `next lint` removed in favor of direct `eslint` invocation. No code changes needed for our use case.
- Replaces a prior wrong-domain prototype (generic strata management) — the new build is tailored to **Strata Business Brokers**, an Australian M&A brokerage. See git history (`git log --all`) for prior work.
