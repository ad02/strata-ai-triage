# Strata AI Triage — Design Spec

**Date:** 2026-05-11
**Author:** Job application — AI Developer role at Strata Management Consultants
**Status:** Approved, ready for implementation planning

---

## 1. Purpose

Build a polished, working prototype that demonstrates AI-powered triage of
incoming client enquiries for a strata management firm. The tool ingests a
free-text enquiry (paste-in for the prototype, email/webform-ready for
production), runs a single Gemini call that returns a structured JSON
analysis, and surfaces the result in a staff "inbox" dashboard.

The spec is scoped to a one-day polished prototype suitable as a job
application submission, deployed to Vercel with the source on GitHub.

## 2. Scoring alignment

The task rubric (40 points):

| Criterion | Pts | How this design maximises it |
|---|---|---|
| AI integration works and produces useful output | 15 | Structured JSON via Gemini `responseSchema`, validated server-side with Zod; covers all four classifications + confidence + urgency + draft reply |
| Code quality, structure, and readability | 8 | Clear `app/` `components/` `lib/` separation; Zod-driven single source of truth; small focused files |
| Practical thinking — solves a real problem | 7 | Inbox UI mirrors real triage workflow; routing target per enquiry; urgency for safety cases; staff-ready draft replies |
| Prompt design and AI interaction approach | 5 | Explicit system instruction with calibrated confidence thresholds; three targeted few-shot examples; structured output schema |
| Bonus features | 5 | Confidence scoring, prompt engineering documentation, error handling, automation roadmap, brief README — all five hit |

## 3. Constraints & decisions

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **AI provider:** Google Gemini (model: `gemini-1.5-flash` for speed; can
  swap to `gemini-2.0-flash` if available — same SDK)
- **State:** In-memory React (Zustand). No database. Refresh clears
  user-added enquiries; seeded enquiries reload from `lib/sample-enquiries.ts`.
- **Validation:** Zod schema as single source of truth; same shape used
  for Gemini `responseSchema` and TS types (`z.infer`).
- **Delivery:** GitHub repo + Vercel live demo. `GEMINI_API_KEY` set as
  Vercel env var, never committed.
- **No database, no auth, no email integration** — deliberately
  out-of-scope. Discussed in README "Production Roadmap".

## 4. AI output schema (single source of truth)

```ts
{
  classification: "new_client" | "support_request" | "complaint" | "general_question",
  classification_confidence: number,   // 0.0–1.0
  classification_reasoning: string,    // 1-sentence justification

  urgency: "low" | "medium" | "high" | "urgent",
  sentiment: "neutral" | "frustrated" | "angry" | "appreciative" | "anxious",

  key_topics: string[],                // e.g. ["levy", "section_184_certificate"]
  entities: {
    lot_number?: string,
    building_or_address?: string,
    sender_role?: "owner" | "tenant" | "agent" | "tradesperson" | "committee" | "unknown",
    deadline_mentioned?: string,       // ISO date if present
  },

  route_to: "front_desk" | "accounts" | "maintenance" | "strata_manager" | "committee" | "legal",
  recommended_action: string,          // 1–2 sentences for staff

  suggested_reply: {
    subject: string,
    body: string,                      // ready-to-send draft email, Australian English
  },

  flags: string[]   // any of: "vague_input", "needs_clarification",
                    //         "out_of_scope", "emergency", "legal_review_needed"
}
```

### Classification taxonomy

| Value | Definition |
|---|---|
| `new_client` | Enquirer is not yet a client. Owners corps shopping for a strata manager; developers setting up a new building. |
| `support_request` | Existing client (lot owner/agent/committee) asking for a specific action — certificate, document, levy detail, by-law copy, contact update. |
| `complaint` | Expresses grievance about a neighbour, building condition, contractor, or our service. |
| `general_question` | Process/info question with no specific action wanted. |

### Confidence calibration (taught to the model in the system prompt)

- `≥ 0.9` — unambiguous, single clear intent
- `0.7–0.9` — clear primary intent, minor ambiguity
- `< 0.7` — ambiguous or mixed; MUST also add `"needs_clarification"` to flags

### Urgency rules (taught to the model)

- `urgent` — life/safety, security breach, legal deadline today/tomorrow,
  fire safety, water ingress, lift entrapment
- `high` — tenant displaced, no hot water, statutory deadline this week
- `medium` — standard service requests with stated timeframes
- `low` — information requests, no deadline

## 5. Prompt engineering approach

### 5.1 Structure

One Gemini call per enquiry, using:

- `systemInstruction` — role, domain context, classification rules,
  confidence calibration, urgency rules, flag definitions, reply tone
  guidance, three few-shot examples
- `generationConfig.responseMimeType` = `"application/json"`
- `generationConfig.responseSchema` = JSON Schema derived from the Zod
  schema in `lib/schema.ts`
- User message — just the raw enquiry text, no formatting

This keeps the per-request payload tiny, leverages Gemini's separate
treatment of `systemInstruction`, and eliminates the malformed-JSON
failure class.

### 5.2 System instruction skeleton

(Will be tuned during implementation; this is the structural template.)

```
You are an AI triage assistant for Strata Management Consultants, an
Australian strata management firm. Your job is to read incoming client
enquiries and produce a structured JSON triage record.

DOMAIN CONTEXT
- Strata managers administer apartment buildings on behalf of Owners
  Corporations. Common topics: levies, by-laws, common-property
  maintenance, AGMs/EGMs, Section 184 certificates, insurance, NCAT
  disputes, fire safety compliance, defects, pets.
- Senders: lot owners, tenants, real estate agents, tradespeople,
  committee members.

CLASSIFICATION RULES
- new_client: enquirer is NOT yet a client. Owners corps shopping for a
  strata manager; developers setting up a new building.
- support_request: existing client (lot owner/agent/committee) asking
  for a specific action — certificate, document, levy detail, by-law
  copy, contact update.
- complaint: expresses grievance about a neighbour, building condition,
  contractor, or our service.
- general_question: process / info question, no specific action wanted.

CONFIDENCE CALIBRATION
- 0.9+: enquiry is unambiguous, single clear intent.
- 0.7–0.9: clear primary intent, minor ambiguity.
- <0.7: ambiguous or mixed → ALSO add "needs_clarification" to flags.

URGENCY RULES
- urgent: life/safety, security breach, legal deadline today/tomorrow,
  fire safety, water ingress, lift entrapment.
- high: tenant displaced, no hot water, statutory deadline this week.
- medium: standard service requests with stated timeframes.
- low: information requests, no deadline.

FLAGS — emit when applicable
- vague_input: too little detail to action confidently.
- needs_clarification: confidence < 0.7 OR multiple equally-likely
  interpretations.
- out_of_scope: not strata-related (e.g. real estate sales, personal
  legal advice).
- emergency: safety risk; route_to should still be set but staff must
  escalate immediately.
- legal_review_needed: NCAT dispute, by-law breach proceedings,
  defamation risk.

REPLY DRAFTING
- Australian English, polite professional tone, no jargon owners
  wouldn't know.
- If urgency = urgent or sentiment = angry, lead with empathy.
- If flags include "needs_clarification", the reply MUST ask 1–3
  specific clarifying questions, NOT make assumptions.
- Sign off as "The Strata Management Team".

[3 FEW-SHOT EXAMPLES — see lib/few-shot.ts]
```

### 5.3 Few-shot examples (three, chosen to cover failure modes)

Chosen to be **scenario-distinct from the seeded demo enquiries** so the
demo actually tests generalisation rather than verbatim recall:

1. **Urgent safety** — "strong gas smell in the lobby of Building B" →
   `complaint`, `urgent`, `flags: ["emergency"]`, route_to `maintenance`;
   reply leads with "call 000 / evacuate if persisting".
2. **Vague input** — `"hi pls help"` → `general_question`, confidence
   `0.25`, `flags: ["vague_input", "needs_clarification"]`, reply asks
   for lot # / building / topic.
3. **Mixed intent** — owner wants quarterly levy breakdown AND complains
   about a tradesperson's behaviour → primary `support_request` (concrete
   action requested), secondary complaint noted in `recommended_action`,
   confidence `0.7`.

### 5.4 Why this design (interview talking points)

- **`responseSchema` over JSON-mode-via-prompting** — reliability. Removes
  a whole class of "AI returned almost-valid JSON" bugs.
- **System instruction over user-message prompting** — separate treatment
  by Gemini, cleaner request payloads, easier to tune.
- **Three few-shot examples specifically** — cover the three failure modes
  expected in production: emergencies, vague inputs, mixed intent.
- **Explicit confidence thresholds** — the model doesn't know what "0.7"
  means unless you tell it. Calibration is intentional.

## 6. Architecture

### 6.1 File structure

```
strata/
├── README.md
├── .env.example
├── .env.local                   # (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # main dashboard
│   ├── globals.css
│   └── api/
│       └── analyze/
│           └── route.ts         # POST /api/analyze
│
├── components/
│   ├── inbox-list.tsx
│   ├── enquiry-detail.tsx
│   ├── ai-analysis-card.tsx
│   ├── suggested-reply-card.tsx
│   ├── new-enquiry-dialog.tsx
│   ├── confidence-badge.tsx
│   ├── urgency-badge.tsx
│   ├── flag-chips.tsx
│   └── ui/                      # shadcn/ui primitives
│
├── lib/
│   ├── gemini.ts                # Gemini client + analyze() function
│   ├── prompt.ts                # systemInstruction string
│   ├── few-shot.ts              # 3 few-shot example pairs
│   ├── schema.ts                # Zod schema (single source of truth)
│   ├── types.ts                 # z.infer types
│   ├── sample-enquiries.ts      # 8 seeded enquiries
│   └── store.ts                 # Zustand enquiry store
│
├── docs/
│   └── superpowers/specs/2026-05-11-strata-ai-triage-design.md
│
└── tests/
    └── schema.test.ts           # Vitest
```

### 6.2 Data flow (single analysis)

```
User clicks enquiry / pastes new one
      ↓
Zustand: setSelected(id), status = "analyzing"
      ↓
fetch POST /api/analyze  { enquiry_text }
      ↓
route.ts → lib/gemini.ts → Gemini API
   (systemInstruction + responseSchema + responseMimeType=json)
      ↓
Zod.parse(geminiResponse)   ← rejects malformed
      ↓
return JSON to client
      ↓
Zustand: store analysis, status = "done" → UI re-renders
```

### 6.3 Why these technology choices

- **Next.js App Router** — single deployable, server route co-located,
  Vercel-ready in 5 minutes
- **shadcn/ui** — owned components in our repo, professional look without
  fighting design tokens
- **Zustand** — 30 LOC store, no boilerplate, easy to explain
- **Zod** — schema → types → Gemini responseSchema, one source of truth
- **Vitest** — one schema test; proves testing literacy without consuming
  hours of the prototype budget

## 7. UI specification — staff inbox dashboard

### 7.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│ Strata AI Triage                       [+ New Enquiry]   │
├──────────────────────┬───────────────────────────────────┤
│ INBOX (left, 320px)  │ DETAIL (right, fills remainder)   │
│                      │                                   │
│ ● New Client         │ From: jane@acme.com               │
│   Mary Chen          │ Subject: Lift broken              │
│   2 min ago          │ Received: …                       │
│                      │                                   │
│ ● Complaint          │ ── Original message ─────────     │
│   Lift broken        │ <enquiry body>                    │
│   1 hr ago           │                                   │
│                      │ ── AI Analysis ──────────────     │
│ ● Support            │ [Classification badge] [Conf 94%] │
│   Levy query         │ [Urgency: HIGH] [Route: maint.]   │
│                      │ Reasoning: …                      │
│                      │ Flags: [emergency] [vague_input]  │
│                      │                                   │
│                      │ ── Suggested Reply ──────────     │
│                      │ Subject: …                        │
│                      │ Body: …                           │
│                      │ [Copy] [Edit] [Send] (mock)       │
└──────────────────────┴───────────────────────────────────┘
```

### 7.2 Components

| Component | Responsibility |
|---|---|
| `inbox-list.tsx` | renders enquiries; selectable; shows classification dot + sender + subject + relative time |
| `enquiry-detail.tsx` | right column shell; shows original message + analysis panels |
| `ai-analysis-card.tsx` | classification + confidence + urgency + sentiment + entities + flags |
| `suggested-reply-card.tsx` | subject/body editor; Copy / Edit / Send (mock) actions |
| `new-enquiry-dialog.tsx` | modal: textarea + optional `from`/`subject` fields |
| `confidence-badge.tsx` | green ≥0.9, amber 0.7–0.9, red <0.7 |
| `urgency-badge.tsx` | grey/blue/orange/red |
| `flag-chips.tsx` | renders each flag with appropriate color and tooltip |

### 7.3 States

- **Empty state** — never seen (seeded enquiries always present)
- **Analyzing** — skeleton loader in analysis card, "Analyzing with
  Gemini…" hint
- **Error** — friendly message + Retry button; preserves the enquiry
- **Low confidence** — red banner above analysis: *"AI flagged this for
  human review — confidence below 0.7"*
- **Emergency flag** — red banner at top of detail: *"⚠ Emergency flag
  set — escalate immediately"*

## 8. Error handling

### 8.1 Semantic (prompt-layer)

| Input | Expected behaviour |
|---|---|
| `"hi"` | classification=`general_question`, confidence ≈0.2, `flags: ["vague_input", "needs_clarification"]`, reply asks for lot # and topic |
| `"asdfghjkl"` | classification=`general_question`, confidence ≈0.1, `flags: ["vague_input", "needs_clarification"]`, polite "could you resend" |
| `"I want to buy a house in Bondi"` | confidence ≈0.6, `flags: ["out_of_scope"]`, reply explains we manage strata not sales |
| `"smoke coming from the lift shaft"` | classification=`complaint`, urgency=`urgent`, `flags: ["emergency"]`, reply leads with "call 000 if anyone is in immediate danger" |

### 8.2 Technical (code-layer)

| Failure | Handling |
|---|---|
| Gemini API timeout (>20s) | AbortController, 504 + `{ error: "ai_timeout" }`; UI retry button |
| Gemini 429 (rate limit) | One retry with 2s backoff, then friendly surface |
| Gemini 500 | One retry, then surface; log full error server-side only |
| Zod parse fails (malformed JSON despite schema) | 502, log raw response, UI "AI returned invalid structure — retry" |
| Missing `GEMINI_API_KEY` | Server boot warning + 503 on first request with clear message |
| Empty / >10k char input | 400 with reason, no API call made |
| Network error client-side | Toast + retry button; original enquiry preserved |

### 8.3 Logging

Server logs each request: `request_id`, `model`, `latency_ms`,
`classification`, `confidence`, `flags`, `tokens_in`, `tokens_out`. **No
enquiry content logged** (privacy). Console-only in the prototype;
production would ship to Datadog/CloudWatch.

## 9. Seeded sample enquiries

Eight enquiries pre-loaded so the dashboard is non-empty and exercises
the full classification + flag matrix.

| # | From | Subject / opening | Tests |
|---|---|---|---|
| 1 | Sarah Mitchell (chair, 14-unit Bondi building) | "Unhappy with current strata manager — onboarding process and pricing?" | `new_client`, high confidence, low urgency |
| 2 | David Chen (lot 7, Newtown) | "Section 184 certificate — property settling 28 May." | `support_request`, deadline extracted, urgency=high, route_to=`front_desk` |
| 3 | Anonymous (`jenny.r@gmail.com`) | "Unit 12 running washing machine at 11pm every night for two weeks." | `complaint`, sentiment=`frustrated`, route_to=`strata_manager` |
| 4 | (no name) | `"hi can someone call me back thx"` | `general_question`, confidence ~0.3, `vague_input` + `needs_clarification` |
| 5 | Tom Patel (lot 22, Parramatta) | "WATER POURING THROUGH CEILING FROM UNIT ABOVE. NOBODY ANSWERING UNIT 23." | `complaint`, urgency=`urgent`, `emergency`, route_to=`maintenance` |
| 6 | Rebecca Lim, Belle Property | "Confirm levy balance and special levies for Lot 4, 15 Marine Pde for upcoming sale." | `support_request`, sender_role=`agent`, route_to=`accounts` |
| 7 | Mark Davies (committee) | "When is the AGM this year?" | `general_question`, low urgency, route_to=`strata_manager` |
| 8 | (`sender@example.com`) | "Interested in selling my apartment, what's the market like in 2026?" | `general_question`, `out_of_scope`, reply redirects |

Each seed has `id`, `received_at`, `from`, `subject`, `body`. **Analyzed
lazily on click** so the interviewer sees the loading state and the
actual live Gemini call.

## 10. Bonus features mapping

| Bonus | Coverage |
|---|---|
| Confidence scoring | `classification_confidence` field + calibration rules in prompt + colour-coded UI badge + < 0.7 banner |
| Prompt engineering | Whole README section quoting the verbatim prompt + few-shot examples + reasoning for each design choice |
| Error handling | Two-layer (semantic via flags, technical via code) — README table walks through behaviour for `"hi"`, `"asdfghjkl"`, out-of-scope, emergency, API timeout, malformed JSON |
| Automation potential | README "Production Roadmap": email gateway → webhook → analyze → route via Slack/Teams + write to CRM; auto-reply gate (confidence > 0.95 AND `general_question`); priority queue from `urgency`; nightly batch report |
| README | Section 11 below |

## 11. README outline

```
# Strata AI Triage

> AI-powered enquiry triage for strata managers.
> Built for the Strata Management Consultants AI Developer application.

[Live demo](https://...) · [Walkthrough video](https://...)

## What it does
Paste a client enquiry → AI classifies it, scores urgency, drafts a
reply, and recommends a routing action.

## Quick start
- `npm install`
- copy `.env.example` → `.env.local`, add `GEMINI_API_KEY`
- `npm run dev` → http://localhost:3000

## How it works
[architecture text diagram]

## AI integration
### Why Gemini 1.5 Flash
### Structured output via responseSchema
### The system instruction (verbatim)
### Few-shot examples (and why these three)
### Confidence calibration

## Error handling
### Semantic: vague, nonsense, out-of-scope, emergency
### Technical: timeout, rate limit, malformed response

## Production roadmap (automation potential)
- Email gateway (Microsoft Graph webhook) → /api/analyze
- Slack / Teams routing per `route_to`
- CRM write-back (HubSpot/Salesforce) with classification + summary
- Auto-reply gate: confidence > 0.95 AND classification = general_question
- Priority queue derived from `urgency`
- Nightly batch report of flag counts, confidence distribution

## Trade-offs & what I'd add next
- in-memory state (no DB) — chose to spend time on AI quality
- single-shot prompt (no chain-of-thought) — Flash is fast enough
- no auth — out of scope for a 1-day prototype

## Tech stack
- Next.js 15 / TypeScript / Tailwind / shadcn/ui
- Zustand (state) / Zod (schema validation) / Vitest (tests)
- @google/generative-ai
```

Two senior-signalling touches:

1. **Verbatim prompt quoted in README** — most candidates hand-wave; we
   paste the actual system instruction so the interviewer can read it.
2. **"Trade-offs" section naming what we didn't build and why** — single
   biggest signal of staff-level thinking.

## 12. Testing strategy

One Vitest file: `tests/schema.test.ts`

- Validates the Zod schema accepts a well-formed analysis object
- Validates rejection on missing required fields
- Validates rejection on out-of-range confidence values
- Validates that the JSON Schema converted from Zod is the shape Gemini
  expects (smoke test)

This is the only thing worth unit-testing in a 1-day prototype. The
interview talking point is "I'd add e2e tests with Playwright and golden
prompts with deterministic seeds before this went to production."

## 13. Out of scope (deliberate)

- No database / persistence — refresh clears user-added enquiries
- No authentication / user accounts
- No real email integration — paste-in only
- No multi-tenant support
- No history / audit log of past analyses
- No retry-with-reasoning chain-of-thought (Flash + responseSchema is fast
  and accurate enough for the prototype)

Each is named with a reason in the README "Trade-offs" section.

## 14. Acceptance criteria

The implementation is complete when:

1. `npm run dev` boots the app at http://localhost:3000
2. The dashboard renders the 8 seeded enquiries in the left column
3. Clicking an enquiry shows the original message and triggers a live
   Gemini call; the analysis card populates within ~3 seconds
4. The `+ New Enquiry` dialog accepts pasted text and analyses it
5. The 8 seeded enquiries produce qualitatively-correct classifications,
   urgencies, and flags (acceptance is judgement-based, not strict-match)
6. Vague input (`"hi"`) produces low confidence + `needs_clarification` flag
7. Emergency input produces `urgent` urgency + `emergency` flag
8. API timeout / 429 / 500 / malformed JSON all surface friendly errors
   with a Retry button
9. `npm test` passes (schema test suite)
10. App deploys to Vercel with `GEMINI_API_KEY` set; live URL works
11. README contains: quick start, verbatim prompt, error-handling
    behaviour table, production-roadmap section, trade-offs section
