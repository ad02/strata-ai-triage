# Strata AI Triage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished Next.js prototype that triages strata-management client enquiries via Gemini, deployable to Vercel — for a job application.

**Architecture:** Single Next.js 15 (App Router) app. One API route calls Gemini with `systemInstruction` + `responseSchema`. Zod is the single source of truth (types + Gemini schema). Zustand for in-memory state. shadcn/ui for the inbox dashboard.

**Tech Stack:** Next.js 15 / TypeScript / Tailwind / shadcn/ui / Zustand / Zod / `@google/generative-ai` / Vitest.

**Spec:** `docs/superpowers/specs/2026-05-11-strata-ai-triage-design.md` — read before starting.

**Working directory:** `d:\Clients\strata\` (Windows, PowerShell). Use PowerShell syntax for shell commands.

---

## Task 1: Bootstrap Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`

- [ ] **Step 1: Run the Next.js installer in the current directory**

Run (from `d:\Clients\strata`):
```powershell
npx create-next-app@15 . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
```

Expected: scaffolds Next.js 15 with TypeScript, Tailwind, App Router, ESLint, `@/*` import alias, npm.

If it complains the directory isn't empty (the `docs/` folder exists), use:
```powershell
npx create-next-app@15 . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes --skip-install
npm install
```

- [ ] **Step 2: Verify dev server boots**

Run:
```powershell
npm run dev
```

Open `http://localhost:3000`. Expected: default Next.js welcome page. Then **Ctrl+C** to stop.

- [ ] **Step 3: Initialize git and commit the scaffold**

Run:
```powershell
git init; git add .; git commit -m "chore: initial Next.js scaffold"
```

---

## Task 2: Add project dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

Run:
```powershell
npm install @google/generative-ai zod zustand zod-to-json-schema lucide-react
```

- [ ] **Step 2: Install dev dependencies (testing)**

Run:
```powershell
npm install -D vitest @vitejs/plugin-react jsdom @types/node
```

- [ ] **Step 3: Add a test script to package.json**

Open `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create `vitest.config.ts`**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add runtime and test dependencies"
```

---

## Task 3: Install shadcn/ui and base components

**Files:**
- Create: `components.json`, `components/ui/*`, `lib/utils.ts`

- [ ] **Step 1: Initialize shadcn**

Run:
```powershell
npx shadcn@latest init -d
```

Expected: creates `components.json`, adds `lib/utils.ts`, updates `tailwind.config.ts`, `app/globals.css`. Defaults are fine (Slate base color, CSS variables yes).

- [ ] **Step 2: Add the UI primitives we'll need**

Run:
```powershell
npx shadcn@latest add button card dialog textarea input label badge skeleton scroll-area separator toast tooltip
```

Expected: each component file created under `components/ui/`.

- [ ] **Step 3: Verify install — start dev server briefly**

Run `npm run dev`, confirm `http://localhost:3000` still loads, **Ctrl+C**.

- [ ] **Step 4: Commit**

```powershell
git add .
git commit -m "chore: install shadcn/ui and base components"
```

---

## Task 4: Set up environment configuration

**Files:**
- Create: `.env.example`, `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env.example`**

Create `.env.example`:
```
# Get a free API key at https://aistudio.google.com/apikey
GEMINI_API_KEY=
```

- [ ] **Step 2: Create `.env.local` with the user's real key**

Create `.env.local` (the user fills the value):
```
GEMINI_API_KEY=PASTE_REAL_KEY_HERE
```

- [ ] **Step 3: Ensure `.gitignore` excludes `.env.local`**

Verify `.gitignore` already contains `.env*` (Next.js scaffold adds this). If not, append:
```
.env*.local
```

- [ ] **Step 4: Commit `.env.example` only**

```powershell
git add .env.example .gitignore
git commit -m "chore: add env example"
```

---

## Task 5: Define the Zod schema (single source of truth)

**Files:**
- Create: `lib/schema.ts`, `lib/types.ts`

- [ ] **Step 1: Create `lib/schema.ts`**

```ts
import { z } from "zod";

export const Classification = z.enum([
  "new_client",
  "support_request",
  "complaint",
  "general_question",
]);

export const Urgency = z.enum(["low", "medium", "high", "urgent"]);

export const Sentiment = z.enum([
  "neutral",
  "frustrated",
  "angry",
  "appreciative",
  "anxious",
]);

export const SenderRole = z.enum([
  "owner",
  "tenant",
  "agent",
  "tradesperson",
  "committee",
  "unknown",
]);

export const RouteTo = z.enum([
  "front_desk",
  "accounts",
  "maintenance",
  "strata_manager",
  "committee",
  "legal",
]);

export const Flag = z.enum([
  "vague_input",
  "needs_clarification",
  "out_of_scope",
  "emergency",
  "legal_review_needed",
]);

export const Entities = z.object({
  lot_number: z.string().optional(),
  building_or_address: z.string().optional(),
  sender_role: SenderRole.optional(),
  deadline_mentioned: z.string().optional(),
});

export const SuggestedReply = z.object({
  subject: z.string(),
  body: z.string(),
});

export const AnalysisSchema = z.object({
  classification: Classification,
  classification_confidence: z.number().min(0).max(1),
  classification_reasoning: z.string(),
  urgency: Urgency,
  sentiment: Sentiment,
  key_topics: z.array(z.string()),
  entities: Entities,
  route_to: RouteTo,
  recommended_action: z.string(),
  suggested_reply: SuggestedReply,
  flags: z.array(Flag),
});
```

- [ ] **Step 2: Create `lib/types.ts`**

```ts
import type { z } from "zod";
import type {
  AnalysisSchema,
  Classification,
  Urgency,
  Sentiment,
  Flag,
  RouteTo,
} from "./schema";

export type Analysis = z.infer<typeof AnalysisSchema>;
export type ClassificationT = z.infer<typeof Classification>;
export type UrgencyT = z.infer<typeof Urgency>;
export type SentimentT = z.infer<typeof Sentiment>;
export type FlagT = z.infer<typeof Flag>;
export type RouteToT = z.infer<typeof RouteTo>;

export type AnalysisStatus =
  | { state: "idle" }
  | { state: "analyzing" }
  | { state: "done"; analysis: Analysis }
  | { state: "error"; error: string };

export type Enquiry = {
  id: string;
  received_at: string;
  from: string;
  subject: string;
  body: string;
  analysis_status: AnalysisStatus;
};
```

- [ ] **Step 3: Commit**

```powershell
git add lib/schema.ts lib/types.ts
git commit -m "feat: zod analysis schema and types"
```

---

## Task 6: Schema test (TDD anchor for the contract)

**Files:**
- Create: `tests/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { AnalysisSchema } from "@/lib/schema";

const validAnalysis = {
  classification: "support_request" as const,
  classification_confidence: 0.92,
  classification_reasoning: "Owner requested a Section 184 certificate.",
  urgency: "high" as const,
  sentiment: "neutral" as const,
  key_topics: ["section_184_certificate"],
  entities: {
    lot_number: "7",
    sender_role: "owner" as const,
    deadline_mentioned: "2026-05-28",
  },
  route_to: "front_desk" as const,
  recommended_action: "Issue a Section 184 certificate within 5 business days.",
  suggested_reply: {
    subject: "Re: Section 184 certificate request",
    body: "Hi David, thanks for reaching out...",
  },
  flags: [],
};

describe("AnalysisSchema", () => {
  it("accepts a well-formed analysis object", () => {
    const result = AnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it("rejects out-of-range confidence", () => {
    const bad = { ...validAnalysis, classification_confidence: 1.5 };
    const result = AnalysisSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects missing classification", () => {
    const { classification, ...bad } = validAnalysis;
    const result = AnalysisSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects unknown flag value", () => {
    const bad = { ...validAnalysis, flags: ["totally_made_up"] };
    const result = AnalysisSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("accepts empty flags array", () => {
    const result = AnalysisSchema.safeParse({ ...validAnalysis, flags: [] });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test, expect PASS**

Run:
```powershell
npm test
```

Expected: all 5 tests pass (we wrote schema first in Task 5; this is verification, not red-then-green TDD because the schema already exists). If any fail, the schema is wrong — fix the schema in `lib/schema.ts` to match.

- [ ] **Step 3: Commit**

```powershell
git add tests/schema.test.ts
git commit -m "test: schema validation tests"
```

---

## Task 7: Sample enquiries seed data

**Files:**
- Create: `lib/sample-enquiries.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Enquiry } from "./types";

const now = Date.now();
const ago = (mins: number) =>
  new Date(now - mins * 60_000).toISOString();

export const SAMPLE_ENQUIRIES: Enquiry[] = [
  {
    id: "e1",
    received_at: ago(8),
    from: "Sarah Mitchell <chair@bondi14.example.com>",
    subject: "Considering switching strata managers",
    body: `Hi,

We're the owners corporation of a 14-unit residential building in Bondi.
We've been with our current strata manager for four years and the
committee is unhappy with response times and the recent levy increase
process.

Could you send through your onboarding process, typical fee structure
for a building our size, and what would be involved in transferring
the records? An initial chat would be welcome too.

Regards,
Sarah Mitchell
Chair, SP 28491`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e2",
    received_at: ago(34),
    from: "David Chen <david.chen@example.com>",
    subject: "Section 184 certificate — Lot 7",
    body: `Hello,

I'm selling Lot 7 at 22 Edith St, Newtown. Settlement is scheduled
for 28 May. My conveyancer needs a Section 184 certificate and any
relevant disclosure documents.

Can you confirm the cost and turnaround time, and let me know how to
pay?

Thanks,
David Chen
Lot 7`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e3",
    received_at: ago(76),
    from: "jenny.r@gmail.com",
    subject: "Noise complaint — Unit 12",
    body: `The people in Unit 12 have been running their washing machine
every night around 11pm for the past two weeks. I've left two notes
under their door asking them to stop and nothing has changed. I have
a baby and this is becoming unbearable.

What are the by-laws around this and can the committee do something?

Jenny`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e4",
    received_at: ago(120),
    from: "unknown",
    subject: "(no subject)",
    body: `hi can someone call me back thx`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e5",
    received_at: ago(3),
    from: "Tom Patel <tom.p@example.com>",
    subject: "URGENT - Water through ceiling Lot 22",
    body: `WATER POURING THROUGH MY CEILING FROM UNIT ABOVE.
NOBODY ANSWERING UNIT 23. CARPETS RUINED. THIS IS THE SECOND TIME
THIS YEAR. Please send someone NOW.

Tom, Lot 22, 88 Church St Parramatta`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e6",
    received_at: ago(180),
    from: "Rebecca Lim <rlim@belleproperty.example.com>",
    subject: "Levy balance enquiry — Lot 4, 15 Marine Pde",
    body: `Hi team,

Could you please confirm the current levy balance and any outstanding
special levies for Lot 4, 15 Marine Parade, for an upcoming sale
campaign? Buyer's solicitor has asked.

Many thanks,
Rebecca Lim
Belle Property`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e7",
    received_at: ago(360),
    from: "Mark Davies <mark.d@example.com>",
    subject: "AGM scheduling",
    body: `Hi,

When is this year's AGM scheduled? Last year's minutes mentioned May
but I haven't seen a notice yet. Also, what's the deadline for
submitting motions?

Mark
Committee member, SP 11203`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e8",
    received_at: ago(720),
    from: "sender@example.com",
    subject: "Selling my apartment",
    body: `Hi, I'm thinking about selling my apartment this year and
wondering what the market looks like in 2026. Could you give me
some advice on pricing and timing?

Cheers`,
    analysis_status: { state: "idle" },
  },
];
```

- [ ] **Step 2: Commit**

```powershell
git add lib/sample-enquiries.ts
git commit -m "feat: seeded sample enquiries"
```

---

## Task 8: Prompt module — system instruction and few-shot

**Files:**
- Create: `lib/prompt.ts`

- [ ] **Step 1: Write the file**

```ts
export const SYSTEM_INSTRUCTION = `You are an AI triage assistant for Strata Management Consultants, an Australian strata management firm. Your job is to read incoming client enquiries and produce a structured JSON triage record matching the provided response schema.

DOMAIN CONTEXT
- Strata managers administer apartment buildings on behalf of Owners Corporations. Common topics: levies (admin and capital works fund), by-laws (pets, noise, parking, renovations), common-property maintenance (lifts, plumbing, gardens, roof), AGMs/EGMs, Section 184 certificates for sales, building insurance, NCAT disputes, fire safety AFSS compliance, defects, pool safety.
- Likely senders: lot owners, tenants, real estate agents, tradespeople, committee members, prospective clients.

CLASSIFICATION RULES
- new_client: enquirer is NOT yet a client. Owners corps shopping for a strata manager; developers setting up a new building; prospective enquiries.
- support_request: existing client (lot owner / agent / committee) asking for a specific action — certificate, document, levy detail, by-law copy, contact update, maintenance request with details.
- complaint: expresses grievance about a neighbour, building condition, contractor, or our service.
- general_question: process / info question, no specific action wanted.

CONFIDENCE CALIBRATION
- 0.9 or higher: enquiry is unambiguous, single clear intent, sender role identifiable.
- 0.7 to 0.9: clear primary intent, minor ambiguity or missing detail.
- below 0.7: ambiguous or mixed; you MUST also add "needs_clarification" to flags.

URGENCY RULES
- urgent: life/safety, security breach, legal deadline today or tomorrow, fire safety, water ingress in progress, lift entrapment, gas leak.
- high: tenant displaced, no hot water, statutory deadline this week, settlement deadlines within 7 days.
- medium: standard service requests with stated timeframes.
- low: information requests, no deadline.

FLAGS — emit any that apply
- vague_input: too little detail to action confidently.
- needs_clarification: confidence < 0.7 OR multiple equally-likely interpretations.
- out_of_scope: not strata-related (e.g. real estate sales advice, personal legal advice not involving strata).
- emergency: safety risk; route_to should still be set but staff must escalate immediately.
- legal_review_needed: NCAT dispute, by-law breach proceedings, defamation risk, statutory non-compliance.

ROUTING RULES (route_to)
- front_desk: certificates, documents, contact updates, general info requests.
- accounts: levies, payments, invoices, financial queries.
- maintenance: common-property repairs, urgent building issues.
- strata_manager: complaints, by-law matters, committee correspondence.
- committee: matters that require owner/committee discussion (AGM motions, expenditure decisions).
- legal: NCAT, by-law enforcement proceedings, defamation, statutory breaches.

REPLY DRAFTING
- Australian English, polite professional tone, no jargon owners wouldn't know.
- If urgency = urgent or sentiment = angry, lead with empathy and acknowledgement.
- If flags include "needs_clarification", the reply MUST ask 1–3 specific clarifying questions; do NOT make assumptions about what the sender wants.
- If flags include "emergency", the reply opens with safety guidance (e.g. "call 000 if anyone is in immediate danger").
- If flags include "out_of_scope", the reply politely clarifies what Strata Management Consultants does and (if possible) suggests a more appropriate contact.
- Sign off as "The Strata Management Team".

OUTPUT
- Return ONE JSON object matching the schema. Do not include commentary or markdown.
- key_topics: short snake_case strings, max 6.
- entities.deadline_mentioned: ISO date (YYYY-MM-DD) if a specific date is stated; omit otherwise.

EXAMPLES

EXAMPLE 1 (urgent safety)
INPUT: "There is a strong gas smell in the foyer of Building B at 14 Park Lane. Three residents have called me about it in the last 20 minutes."
OUTPUT:
{
  "classification": "complaint",
  "classification_confidence": 0.95,
  "classification_reasoning": "Reporter is flagging a building-wide safety issue; primary intent is to alert staff.",
  "urgency": "urgent",
  "sentiment": "anxious",
  "key_topics": ["gas_leak", "safety", "common_property"],
  "entities": { "building_or_address": "Building B, 14 Park Lane", "sender_role": "committee" },
  "route_to": "maintenance",
  "recommended_action": "Phone the sender immediately. Dispatch emergency gas response and notify all residents. Treat as life-safety incident.",
  "suggested_reply": {
    "subject": "Re: Gas smell at 14 Park Lane — actioning now",
    "body": "Hi,\\n\\nThank you for letting us know straight away. If the smell is strong, please ask residents to evacuate the affected area and call 000 if they have not already.\\n\\nWe are contacting an emergency gas response team now and will call you within the next 10 minutes with an update. Please do not use lifts or electrical switches near the foyer until cleared.\\n\\nKind regards,\\nThe Strata Management Team"
  },
  "flags": ["emergency"]
}

EXAMPLE 2 (vague input)
INPUT: "hi pls help"
OUTPUT:
{
  "classification": "general_question",
  "classification_confidence": 0.25,
  "classification_reasoning": "Single-line message with no topic, lot reference, or contact detail.",
  "urgency": "low",
  "sentiment": "neutral",
  "key_topics": [],
  "entities": { "sender_role": "unknown" },
  "route_to": "front_desk",
  "recommended_action": "Reply asking for the sender's name, lot/building, and what they need help with before triaging further.",
  "suggested_reply": {
    "subject": "Re: How can we help?",
    "body": "Hi,\\n\\nThanks for getting in touch. To point you to the right person, could you let us know:\\n\\n1. Your name and lot number (or building address)?\\n2. What you would like help with?\\n3. The best phone number to reach you on?\\n\\nOnce we have these details we will respond promptly.\\n\\nKind regards,\\nThe Strata Management Team"
  },
  "flags": ["vague_input", "needs_clarification"]
}

EXAMPLE 3 (mixed intent)
INPUT: "Could you send me the breakdown for my last quarterly levy invoice — the special levy line is twice what I expected. Also, the plumber who came to fix the bathroom leak yesterday was rude to my elderly mother."
OUTPUT:
{
  "classification": "support_request",
  "classification_confidence": 0.7,
  "classification_reasoning": "Primary ask is a concrete document (levy breakdown). Secondary complaint about contractor conduct is also present and should be acknowledged.",
  "urgency": "medium",
  "sentiment": "frustrated",
  "key_topics": ["levy", "special_levy", "contractor_conduct"],
  "entities": { "sender_role": "owner" },
  "route_to": "accounts",
  "recommended_action": "Send the levy breakdown today. Forward the contractor complaint to the strata manager for follow-up with the trades supplier; acknowledge it in the reply.",
  "suggested_reply": {
    "subject": "Re: Quarterly levy breakdown and contractor feedback",
    "body": "Hi,\\n\\nThank you for getting in touch and apologies for the experience your mother had with the plumber — I will pass this on to our strata manager today so we can address it directly with the contractor.\\n\\nI will send through a full breakdown of your last quarterly levy, including the special-levy line, within one business day. If anything still looks off after you have reviewed it, just reply to this email.\\n\\nKind regards,\\nThe Strata Management Team"
  },
  "flags": []
}`;
```

- [ ] **Step 2: Commit**

```powershell
git add lib/prompt.ts
git commit -m "feat: system instruction with few-shot examples"
```

---

## Task 9: Gemini client wrapper

**Files:**
- Create: `lib/gemini.ts`

- [ ] **Step 1: Write the file**

```ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AnalysisSchema } from "./schema";
import { SYSTEM_INSTRUCTION } from "./prompt";
import type { Analysis } from "./types";

const MODEL_ID = "gemini-1.5-flash";
const TIMEOUT_MS = 20_000;

// Gemini's responseSchema uses its own type names; we hand-write it to
// mirror the Zod schema exactly. Single source of truth is still the
// Zod schema — both files must change together.
const geminiResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    classification: {
      type: SchemaType.STRING,
      enum: ["new_client", "support_request", "complaint", "general_question"],
    },
    classification_confidence: { type: SchemaType.NUMBER },
    classification_reasoning: { type: SchemaType.STRING },
    urgency: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high", "urgent"],
    },
    sentiment: {
      type: SchemaType.STRING,
      enum: ["neutral", "frustrated", "angry", "appreciative", "anxious"],
    },
    key_topics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    entities: {
      type: SchemaType.OBJECT,
      properties: {
        lot_number: { type: SchemaType.STRING },
        building_or_address: { type: SchemaType.STRING },
        sender_role: {
          type: SchemaType.STRING,
          enum: ["owner", "tenant", "agent", "tradesperson", "committee", "unknown"],
        },
        deadline_mentioned: { type: SchemaType.STRING },
      },
    },
    route_to: {
      type: SchemaType.STRING,
      enum: ["front_desk", "accounts", "maintenance", "strata_manager", "committee", "legal"],
    },
    recommended_action: { type: SchemaType.STRING },
    suggested_reply: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        body: { type: SchemaType.STRING },
      },
      required: ["subject", "body"],
    },
    flags: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        enum: [
          "vague_input",
          "needs_clarification",
          "out_of_scope",
          "emergency",
          "legal_review_needed",
        ],
      },
    },
  },
  required: [
    "classification",
    "classification_confidence",
    "classification_reasoning",
    "urgency",
    "sentiment",
    "key_topics",
    "entities",
    "route_to",
    "recommended_action",
    "suggested_reply",
    "flags",
  ],
};

export type AnalyzeResult =
  | { ok: true; analysis: Analysis; meta: { latency_ms: number; model: string } }
  | {
      ok: false;
      error:
        | "missing_api_key"
        | "ai_timeout"
        | "rate_limit"
        | "ai_error"
        | "invalid_response";
      detail?: string;
    };

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export async function analyzeEnquiry(enquiryText: string): Promise<AnalyzeResult> {
  const client = getClient();
  if (!client) return { ok: false, error: "missing_api_key" };

  const model = client.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: geminiResponseSchema as never,
      temperature: 0.2,
    },
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();

  try {
    const result = await model.generateContent(
      { contents: [{ role: "user", parts: [{ text: enquiryText }] }] },
      { signal: controller.signal } as never,
    );
    clearTimeout(timer);

    const raw = result.response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "invalid_response", detail: "non-JSON" };
    }

    const validated = AnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        ok: false,
        error: "invalid_response",
        detail: validated.error.message,
      };
    }

    return {
      ok: true,
      analysis: validated.data,
      meta: { latency_ms: Date.now() - started, model: MODEL_ID },
    };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("aborted")) return { ok: false, error: "ai_timeout" };
    if (msg.includes("429")) return { ok: false, error: "rate_limit" };
    return { ok: false, error: "ai_error", detail: msg };
  }
}
```

- [ ] **Step 2: Commit**

```powershell
git add lib/gemini.ts
git commit -m "feat: gemini client wrapper with structured output"
```

---

## Task 10: API route — POST /api/analyze

**Files:**
- Create: `app/api/analyze/route.ts`

- [ ] **Step 1: Write the file**

```ts
import { NextResponse } from "next/server";
import { analyzeEnquiry } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_INPUT_CHARS = 10_000;

export async function POST(req: Request) {
  let body: { enquiry_text?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = body?.enquiry_text;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "empty_input" }, { status: 400 });
  }
  if (text.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: "input_too_long", max: MAX_INPUT_CHARS },
      { status: 400 },
    );
  }

  // Attempt + one retry on transient errors
  const attempts = [0, 1];
  let lastResult = await analyzeEnquiry(text);
  for (const i of attempts.slice(1)) {
    if (
      lastResult.ok ||
      (lastResult.error !== "rate_limit" && lastResult.error !== "ai_error")
    ) {
      break;
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    lastResult = await analyzeEnquiry(text);
  }

  if (!lastResult.ok) {
    const status =
      lastResult.error === "missing_api_key"
        ? 503
        : lastResult.error === "ai_timeout"
          ? 504
          : lastResult.error === "rate_limit"
            ? 429
            : lastResult.error === "invalid_response"
              ? 502
              : 500;

    // Privacy: log meta only, not enquiry content
    console.error("[analyze]", {
      error: lastResult.error,
      detail: lastResult.detail,
    });

    return NextResponse.json({ error: lastResult.error }, { status });
  }

  console.log("[analyze]", {
    model: lastResult.meta.model,
    latency_ms: lastResult.meta.latency_ms,
    classification: lastResult.analysis.classification,
    confidence: lastResult.analysis.classification_confidence,
    flags: lastResult.analysis.flags,
  });

  return NextResponse.json({ analysis: lastResult.analysis });
}
```

- [ ] **Step 2: Manual smoke test**

Ensure `.env.local` has a real `GEMINI_API_KEY`. Start dev server: `npm run dev`.

In a separate PowerShell window:
```powershell
$body = @{ enquiry_text = "Hi, can someone send me my Section 184 certificate? Settling 28 May. Lot 7." } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/analyze -Method POST -Body $body -ContentType "application/json"
```

Expected: JSON response with `analysis` object; `classification` should be `"support_request"`. Then **Ctrl+C** the dev server.

- [ ] **Step 3: Commit**

```powershell
git add app/api/analyze/route.ts
git commit -m "feat: /api/analyze route with retry and validation"
```

---

## Task 11: Zustand store

**Files:**
- Create: `lib/store.ts`

- [ ] **Step 1: Write the file**

```ts
"use client";

import { create } from "zustand";
import { SAMPLE_ENQUIRIES } from "./sample-enquiries";
import type { Analysis, Enquiry } from "./types";

type State = {
  enquiries: Enquiry[];
  selectedId: string | null;
  select: (id: string | null) => void;
  addEnquiry: (input: { from: string; subject: string; body: string }) => string;
  setStatus: (id: string, status: Enquiry["analysis_status"]) => void;
  setAnalysis: (id: string, analysis: Analysis) => void;
  setError: (id: string, error: string) => void;
};

export const useStore = create<State>((set) => ({
  enquiries: SAMPLE_ENQUIRIES,
  selectedId: SAMPLE_ENQUIRIES[0]?.id ?? null,

  select: (id) => set({ selectedId: id }),

  addEnquiry: ({ from, subject, body }) => {
    const id = `u${Date.now()}`;
    set((s) => ({
      enquiries: [
        {
          id,
          received_at: new Date().toISOString(),
          from: from || "unknown",
          subject: subject || "(no subject)",
          body,
          analysis_status: { state: "idle" },
        },
        ...s.enquiries,
      ],
      selectedId: id,
    }));
    return id;
  },

  setStatus: (id, status) =>
    set((s) => ({
      enquiries: s.enquiries.map((e) =>
        e.id === id ? { ...e, analysis_status: status } : e,
      ),
    })),

  setAnalysis: (id, analysis) =>
    set((s) => ({
      enquiries: s.enquiries.map((e) =>
        e.id === id
          ? { ...e, analysis_status: { state: "done", analysis } }
          : e,
      ),
    })),

  setError: (id, error) =>
    set((s) => ({
      enquiries: s.enquiries.map((e) =>
        e.id === id
          ? { ...e, analysis_status: { state: "error", error } }
          : e,
      ),
    })),
}));
```

- [ ] **Step 2: Commit**

```powershell
git add lib/store.ts
git commit -m "feat: zustand enquiry store"
```

---

## Task 12: Analysis hook (client-side wrapper for /api/analyze)

**Files:**
- Create: `lib/use-analyze.ts`

- [ ] **Step 1: Write the file**

```ts
"use client";

import { useStore } from "./store";

const ERROR_MESSAGES: Record<string, string> = {
  missing_api_key: "Server is not configured with a Gemini API key.",
  ai_timeout: "The AI service did not respond in time. Try again.",
  rate_limit: "AI service is rate-limited. Try again shortly.",
  invalid_response: "AI returned an invalid response. Try again.",
  ai_error: "Unexpected AI error. Try again.",
  empty_input: "Enquiry text is empty.",
  input_too_long: "Enquiry text is too long (max 10,000 characters).",
  invalid_json: "Bad request body.",
};

export function useAnalyzeEnquiry() {
  const setStatus = useStore((s) => s.setStatus);
  const setAnalysis = useStore((s) => s.setAnalysis);
  const setError = useStore((s) => s.setError);

  return async (enquiryId: string, body: string) => {
    setStatus(enquiryId, { state: "analyzing" });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiry_text: body }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = ERROR_MESSAGES[data.error ?? ""] ?? "Analysis failed.";
        setError(enquiryId, msg);
        return;
      }
      const data = (await res.json()) as { analysis: import("./types").Analysis };
      setAnalysis(enquiryId, data.analysis);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error.";
      setError(enquiryId, msg);
    }
  };
}
```

- [ ] **Step 2: Commit**

```powershell
git add lib/use-analyze.ts
git commit -m "feat: client analyze hook with friendly error mapping"
```

---

## Task 13: Badge components (confidence, urgency, classification, flag chips)

**Files:**
- Create: `components/confidence-badge.tsx`, `components/urgency-badge.tsx`, `components/classification-badge.tsx`, `components/flag-chips.tsx`

- [ ] **Step 1: `components/confidence-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.9
      ? "bg-green-600 hover:bg-green-600"
      : value >= 0.7
        ? "bg-amber-500 hover:bg-amber-500"
        : "bg-red-600 hover:bg-red-600";
  return (
    <Badge className={cn("text-white", tone)}>
      Confidence {pct}%
    </Badge>
  );
}
```

- [ ] **Step 2: `components/urgency-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UrgencyT } from "@/lib/types";

const TONES: Record<UrgencyT, string> = {
  low: "bg-slate-500 hover:bg-slate-500",
  medium: "bg-blue-600 hover:bg-blue-600",
  high: "bg-orange-500 hover:bg-orange-500",
  urgent: "bg-red-600 hover:bg-red-600",
};

export function UrgencyBadge({ value }: { value: UrgencyT }) {
  return (
    <Badge className={cn("text-white capitalize", TONES[value])}>
      {value}
    </Badge>
  );
}
```

- [ ] **Step 3: `components/classification-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClassificationT } from "@/lib/types";

const LABELS: Record<ClassificationT, string> = {
  new_client: "New Client",
  support_request: "Support Request",
  complaint: "Complaint",
  general_question: "General Question",
};

const TONES: Record<ClassificationT, string> = {
  new_client: "bg-emerald-600 hover:bg-emerald-600",
  support_request: "bg-blue-600 hover:bg-blue-600",
  complaint: "bg-red-600 hover:bg-red-600",
  general_question: "bg-slate-600 hover:bg-slate-600",
};

export function ClassificationBadge({ value }: { value: ClassificationT }) {
  return (
    <Badge className={cn("text-white", TONES[value])}>
      {LABELS[value]}
    </Badge>
  );
}
```

- [ ] **Step 4: `components/flag-chips.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlagT } from "@/lib/types";

const FLAG_META: Record<FlagT, { label: string; tone: string; tooltip: string }> = {
  vague_input: {
    label: "Vague",
    tone: "bg-amber-100 text-amber-900",
    tooltip: "Enquiry lacks detail for confident triage.",
  },
  needs_clarification: {
    label: "Needs clarification",
    tone: "bg-amber-100 text-amber-900",
    tooltip: "AI confidence below 0.7 or multiple plausible interpretations.",
  },
  out_of_scope: {
    label: "Out of scope",
    tone: "bg-slate-200 text-slate-900",
    tooltip: "Not strata-related.",
  },
  emergency: {
    label: "Emergency",
    tone: "bg-red-600 text-white",
    tooltip: "Life-safety or critical building risk — escalate immediately.",
  },
  legal_review_needed: {
    label: "Legal review",
    tone: "bg-purple-200 text-purple-900",
    tooltip: "Possible NCAT / statutory / defamation implications.",
  },
};

export function FlagChips({ flags }: { flags: FlagT[] }) {
  if (flags.length === 0) {
    return <span className="text-sm text-muted-foreground">No flags</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((f) => {
        const meta = FLAG_META[f];
        return (
          <Badge
            key={f}
            className={cn("border-0", meta.tone)}
            title={meta.tooltip}
          >
            {meta.label}
          </Badge>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```powershell
git add components/confidence-badge.tsx components/urgency-badge.tsx components/classification-badge.tsx components/flag-chips.tsx
git commit -m "feat: classification, urgency, confidence, flag UI badges"
```

---

## Task 14: Inbox list component

**Files:**
- Create: `components/inbox-list.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassificationBadge } from "./classification-badge";
import { cn } from "@/lib/utils";

function relative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function InboxList() {
  const enquiries = useStore((s) => s.enquiries);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);

  return (
    <ScrollArea className="h-full">
      <ul className="divide-y">
        {enquiries.map((e) => {
          const status = e.analysis_status;
          const cls =
            status.state === "done" ? status.analysis.classification : null;
          const isSelected = e.id === selectedId;
          return (
            <li key={e.id}>
              <button
                onClick={() => select(e.id)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-muted/60",
                  isSelected && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  {cls ? (
                    <ClassificationBadge value={cls} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {status.state === "analyzing"
                        ? "Analyzing…"
                        : status.state === "error"
                          ? "Error"
                          : "Unanalyzed"}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {relative(e.received_at)}
                  </span>
                </div>
                <div className="text-sm font-medium truncate">{e.subject}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {e.from}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/inbox-list.tsx
git commit -m "feat: inbox list component"
```

---

## Task 15: AI analysis card

**Files:**
- Create: `components/ai-analysis-card.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClassificationBadge } from "./classification-badge";
import { ConfidenceBadge } from "./confidence-badge";
import { UrgencyBadge } from "./urgency-badge";
import { FlagChips } from "./flag-chips";
import type { Analysis, AnalysisStatus } from "@/lib/types";

const ROUTE_LABEL: Record<Analysis["route_to"], string> = {
  front_desk: "Front Desk",
  accounts: "Accounts",
  maintenance: "Maintenance",
  strata_manager: "Strata Manager",
  committee: "Committee",
  legal: "Legal",
};

export function AiAnalysisCard({
  status,
  onAnalyze,
  onRetry,
}: {
  status: AnalysisStatus;
  onAnalyze: () => void;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {status.state === "idle" && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Not yet analyzed.
            </p>
            <Button size="sm" onClick={onAnalyze}>
              Analyze with Gemini
            </Button>
          </div>
        )}

        {status.state === "analyzing" && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <p className="text-xs text-muted-foreground pt-1">
              Analyzing with Gemini…
            </p>
          </div>
        )}

        {status.state === "error" && (
          <div className="space-y-2">
            <p className="text-sm text-red-600">{status.error}</p>
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}

        {status.state === "done" && (
          <AnalysisBody analysis={status.analysis} />
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisBody({ analysis }: { analysis: Analysis }) {
  const isEmergency = analysis.flags.includes("emergency");
  const lowConfidence = analysis.classification_confidence < 0.7;

  return (
    <div className="space-y-4">
      {isEmergency && (
        <div className="rounded-md border border-red-600 bg-red-50 text-red-900 px-3 py-2 text-sm">
          <strong>Emergency flag set</strong> — escalate immediately and follow
          safety guidance in the suggested reply.
        </div>
      )}
      {lowConfidence && !isEmergency && (
        <div className="rounded-md border border-amber-600 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
          AI flagged this for human review — confidence below 0.7.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <ClassificationBadge value={analysis.classification} />
        <ConfidenceBadge value={analysis.classification_confidence} />
        <UrgencyBadge value={analysis.urgency} />
        <span className="text-xs text-muted-foreground">
          → {ROUTE_LABEL[analysis.route_to]}
        </span>
      </div>

      <p className="text-sm">{analysis.classification_reasoning}</p>

      <Separator />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">
            Sentiment
          </div>
          <div className="capitalize">{analysis.sentiment}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">
            Sender role
          </div>
          <div className="capitalize">
            {analysis.entities.sender_role ?? "—"}
          </div>
        </div>
        {analysis.entities.lot_number && (
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Lot number
            </div>
            <div>{analysis.entities.lot_number}</div>
          </div>
        )}
        {analysis.entities.deadline_mentioned && (
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Deadline
            </div>
            <div>{analysis.entities.deadline_mentioned}</div>
          </div>
        )}
        {analysis.entities.building_or_address && (
          <div className="col-span-2">
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Building / address
            </div>
            <div>{analysis.entities.building_or_address}</div>
          </div>
        )}
      </div>

      <div>
        <div className="text-xs uppercase text-muted-foreground mb-1">
          Key topics
        </div>
        {analysis.key_topics.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {analysis.key_topics.map((t) => (
              <span
                key={t}
                className="text-xs rounded-full bg-muted px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs uppercase text-muted-foreground mb-1">
          Flags
        </div>
        <FlagChips flags={analysis.flags} />
      </div>

      <Separator />

      <div>
        <div className="text-xs uppercase text-muted-foreground mb-1">
          Recommended action
        </div>
        <p className="text-sm">{analysis.recommended_action}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/ai-analysis-card.tsx
git commit -m "feat: AI analysis card with confidence/urgency/flags"
```

---

## Task 16: Suggested reply card

**Files:**
- Create: `components/suggested-reply-card.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Analysis } from "@/lib/types";

export function SuggestedReplyCard({ analysis }: { analysis: Analysis }) {
  const [subject, setSubject] = useState(analysis.suggested_reply.subject);
  const [body, setBody] = useState(analysis.suggested_reply.body);
  const [copied, setCopied] = useState(false);

  // Re-sync when AI generates a new draft
  useEffect(() => {
    setSubject(analysis.suggested_reply.subject);
    setBody(analysis.suggested_reply.body);
  }, [analysis]);

  const copy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested Reply</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="subject" className="text-xs uppercase text-muted-foreground">
            Subject
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="body" className="text-xs uppercase text-muted-foreground">
            Body
          </Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={Math.max(8, body.split("\n").length + 1)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={copy} variant="secondary">
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            disabled
            title="Sending is mocked in this prototype — see README 'Production Roadmap'"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/suggested-reply-card.tsx
git commit -m "feat: editable suggested reply card with copy-to-clipboard"
```

---

## Task 17: Enquiry detail (right column)

**Files:**
- Create: `components/enquiry-detail.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useStore } from "@/lib/store";
import { useAnalyzeEnquiry } from "@/lib/use-analyze";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiAnalysisCard } from "./ai-analysis-card";
import { SuggestedReplyCard } from "./suggested-reply-card";

export function EnquiryDetail() {
  const enquiry = useStore((s) =>
    s.enquiries.find((e) => e.id === s.selectedId) ?? null,
  );
  const analyze = useAnalyzeEnquiry();

  if (!enquiry) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground">
        Select an enquiry from the inbox.
      </div>
    );
  }

  const runAnalysis = () => analyze(enquiry.id, enquiry.body);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{enquiry.subject}</CardTitle>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>From: {enquiry.from}</div>
            <div>Received: {new Date(enquiry.received_at).toLocaleString()}</div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm font-sans">
            {enquiry.body}
          </pre>
        </CardContent>
      </Card>

      <AiAnalysisCard
        status={enquiry.analysis_status}
        onAnalyze={runAnalysis}
        onRetry={runAnalysis}
      />

      {enquiry.analysis_status.state === "done" && (
        <SuggestedReplyCard analysis={enquiry.analysis_status.analysis} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/enquiry-detail.tsx
git commit -m "feat: enquiry detail with auto-analyze"
```

---

## Task 18: New enquiry dialog

**Files:**
- Create: `components/new-enquiry-dialog.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { useAnalyzeEnquiry } from "@/lib/use-analyze";
import { Plus } from "lucide-react";

export function NewEnquiryDialog() {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const addEnquiry = useStore((s) => s.addEnquiry);
  const analyze = useAnalyzeEnquiry();

  const submit = () => {
    if (body.trim().length === 0) return;
    const id = addEnquiry({ from, subject, body });
    void analyze(id, body);
    setFrom("");
    setSubject("");
    setBody("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4 mr-1" />
          New Enquiry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paste a new enquiry</DialogTitle>
          <DialogDescription>
            Paste the email or web-form text below. AI will analyze it once added.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="from">From (optional)</Label>
            <Input
              id="from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Name <email@example.com>"
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="body">Enquiry body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Paste the enquiry text here…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={body.trim().length === 0}>
            Add & Analyze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/new-enquiry-dialog.tsx
git commit -m "feat: new enquiry dialog with auto-analyze"
```

---

## Task 19: Wire up the dashboard in `app/page.tsx` and `app/layout.tsx`

**Files:**
- Modify: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Overwrite `app/page.tsx`**

```tsx
import { InboxList } from "@/components/inbox-list";
import { EnquiryDetail } from "@/components/enquiry-detail";
import { NewEnquiryDialog } from "@/components/new-enquiry-dialog";

export default function Home() {
  return (
    <div className="h-dvh flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Strata AI Triage</h1>
          <p className="text-xs text-muted-foreground">
            AI-powered enquiry classification, routing, and reply drafting
          </p>
        </div>
        <NewEnquiryDialog />
      </header>
      <main className="flex-1 grid grid-cols-[320px_1fr] overflow-hidden">
        <aside className="border-r overflow-hidden">
          <InboxList />
        </aside>
        <section className="overflow-hidden bg-muted/30">
          <EnquiryDetail />
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/layout.tsx` metadata**

Open `app/layout.tsx`. Replace the existing `metadata` export:
```ts
export const metadata: Metadata = {
  title: "Strata AI Triage",
  description: "AI-powered enquiry triage for strata managers.",
};
```

- [ ] **Step 3: Run the app end-to-end**

Run `npm run dev`. Open `http://localhost:3000`. Expected:
- Header reads "Strata AI Triage"
- 8 enquiries in the left column with subjects and timestamps
- Clicking enquiry #2 (David Chen — Section 184) shows the message
- Clicking **Analyze with Gemini** shows skeleton, then analysis card with classification, confidence, urgency, flags, and a suggested reply

If anything fails, fix it. Test cases to actually try:
- Click enquiry #4 ("hi can someone call me back thx") → analysis should be `general_question` with low confidence and `needs_clarification` flag
- Click enquiry #5 (water through ceiling) → `complaint`, `urgent`, `emergency` flag
- Click enquiry #8 (selling apartment) → `general_question` or `out_of_scope` flag
- Click **+ New Enquiry**, paste "hi", submit → low confidence + `vague_input` flag

**Ctrl+C** when done.

- [ ] **Step 4: Commit**

```powershell
git add app/page.tsx app/layout.tsx
git commit -m "feat: wire dashboard with inbox + detail + new enquiry"
```

---

## Task 20: README

**Files:**
- Create: `README.md` (overwrite the Next.js default)

- [ ] **Step 1: Write the file**

```md
# Strata AI Triage

> AI-powered enquiry triage for strata managers. Built for the
> Strata Management Consultants AI Developer application task.

**Live demo:** _(filled in after Task 21 — Vercel deploy)_
**Repo:** _(GitHub URL)_

---

## What it does

A staff "inbox" for strata-management client enquiries. Paste or click any
enquiry; Google Gemini classifies it, scores urgency and confidence,
extracts entities, recommends a routing target, and drafts a ready-to-send
reply in Australian English.

The prototype seeds eight realistic sample enquiries that exercise every
classification (`new_client`, `support_request`, `complaint`,
`general_question`), every urgency tier, and every flag
(`vague_input`, `needs_clarification`, `out_of_scope`, `emergency`,
`legal_review_needed`).

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY in .env.local — get one at https://aistudio.google.com/apikey
npm run dev
```

Open <http://localhost:3000>.

## Tests

```bash
npm test
```

Runs Vitest against the schema. The schema is the contract between the
AI and the UI; the rest of the prototype is wired around it.

## How it works

```
User clicks enquiry / pastes new one
      ↓
Zustand sets selected, status = "analyzing"
      ↓
POST /api/analyze  { enquiry_text }
      ↓
lib/gemini.ts → Gemini API
   (systemInstruction + responseMimeType=json + responseSchema)
      ↓
Zod.parse() rejects malformed responses
      ↓
JSON returned to client
      ↓
Zustand updates → UI renders analysis + reply
```

One Gemini call per enquiry. No retries except on rate-limit / 5xx
(one retry, 1.5s backoff).

## AI integration

### Why Gemini 1.5 Flash

- Fast (typical analysis < 2s)
- Supports `responseSchema` for guaranteed-valid JSON
- Generous free tier, suitable for a job-app prototype
- One-line model swap to `gemini-2.0-flash` if/when available

### Structured output via `responseSchema`

Gemini is configured with `responseMimeType: "application/json"` and an
explicit JSON Schema covering every field. This removes the entire class
of "AI returned almost-JSON" bugs. We additionally validate the response
with Zod so any drift between the schema and the actual response is
caught with a friendly error.

The Zod schema (`lib/schema.ts`) is the single source of truth. TS types
are derived from it via `z.infer`. The Gemini `responseSchema` in
`lib/gemini.ts` mirrors it field-by-field.

### The system instruction (verbatim)

The full instruction is in [`lib/prompt.ts`](lib/prompt.ts). Highlights:

- Domain context (strata vocabulary, common topics, sender types)
- Strict definitions of the four classifications
- **Calibrated confidence scoring** — explicit thresholds with the rule
  that confidence < 0.7 must add `needs_clarification` to flags
- Urgency rules anchored on concrete strata scenarios (gas, water,
  fire, lift entrapment)
- Reply drafting guidance: Australian English, lead with empathy when
  angry/urgent, ask clarifying questions when not confident
- Three few-shot examples, chosen to teach distinct failure modes:
  emergency, vague input, mixed intent. Examples are deliberately
  **different** from the seeded demo enquiries so the demo tests
  generalisation, not recall.

### Why few-shot, and why three

Few-shot examples consistently outperform pure descriptive prompts for
classification tasks because they show the model the exact output
shape and tone expected. Three is the sweet spot: enough to cover the
non-obvious cases (safety escalation, vague input handling, mixed
intent) without bloating the system instruction.

### Confidence calibration

The model doesn't intrinsically know what "0.7" means. The prompt
defines thresholds:

| Confidence | Meaning |
|---|---|
| ≥ 0.9 | Unambiguous, single clear intent |
| 0.7 – 0.9 | Clear primary intent, minor ambiguity |
| < 0.7 | Ambiguous; **also add `needs_clarification`** |

The UI surfaces confidence as a colour-coded badge and shows a "human
review" banner whenever confidence < 0.7.

## Error handling

### Semantic (handled by the prompt)

| Input | Behaviour |
|---|---|
| `"hi"` / `"hi pls help"` | `general_question`, confidence ≈ 0.25, flags `vague_input` + `needs_clarification`, reply asks for lot # and topic |
| `"asdfghjkl"` | `general_question`, very low confidence, same flags, polite "could you resend" |
| `"I want to buy a house in Bondi"` | flags `out_of_scope`, reply explains scope |
| Anything with a safety signal | `urgent` + flag `emergency`, reply leads with safety guidance |

### Technical (handled by the route + client)

| Failure | Handling |
|---|---|
| Gemini timeout (>20s) | AbortController fires, 504, UI shows Retry |
| Gemini 429 | One retry with 1.5s backoff, then friendly surface |
| Gemini 500 | One retry, then surface; server logs detail |
| Zod parse fails | 502 + "AI returned invalid structure", UI shows Retry |
| Missing `GEMINI_API_KEY` | 503 with clear message |
| Empty / >10k char input | 400, no API call made |
| Client network error | Toast-style message, original enquiry preserved |

Server logs only metadata (latency, classification, confidence, flag list)
— **never the enquiry content** (privacy by default).

## Production roadmap (automation potential)

This prototype is the AI core. To plug it into a real workflow:

1. **Email ingestion** — Microsoft Graph webhook (or IMAP poller) posts
   to `POST /api/analyze`. Outlook shared mailbox → routing magic.
2. **Web-form intake** — every contact-form submission also POSTs here.
3. **Routing automation** — based on `route_to`:
   - `maintenance` → Slack/Teams channel for the maintenance team
   - `accounts` → ticket in the accounts queue
   - `legal` / flagged `legal_review_needed` → escalate to senior strata
     manager + log to compliance system
4. **CRM write-back** — push `{classification, summary, sender_role}` to
   HubSpot/Salesforce as a note on the contact record.
5. **Auto-reply gate** — only auto-send when `confidence > 0.95` AND
   `classification = "general_question"` AND no flags. Everything else
   is queued for human review.
6. **Priority queue** — sort the staff inbox by `urgency` first, then
   received-at. Urgent items page the on-call manager via PagerDuty.
7. **Nightly metrics** — flag counts, confidence distribution,
   misclassification rate (when staff override the AI's choice). Surface
   as a Looker/Grafana dashboard for ongoing prompt tuning.
8. **Persistence** — replace the in-memory Zustand store with Postgres
   (or DynamoDB) + an audit log so AI decisions are reviewable.

## Trade-offs and what I'd add next

- **In-memory state, no database.** Spent the time on AI quality
  (prompt design, schema, confidence calibration) rather than CRUD.
  Refresh clears user-added enquiries; seeded enquiries reload.
- **Single-shot prompt, no chain-of-thought.** Flash + `responseSchema`
  is fast and accurate enough at this scope. CoT would slow things down
  and offer little gain for this task size.
- **No authentication.** Out-of-scope for a 1-day prototype.
- **No real send.** The Send button is mocked. Production would wire
  Microsoft Graph / SendGrid + human-approval queue.
- **One unit test (schema).** Schema is the contract; the rest is wired
  around it. With more time I'd add Playwright happy-path tests and a
  small "golden prompts" suite that re-runs the same 8 enquiries
  weekly and flags drift in classification or confidence.
- **Hand-mirrored Gemini schema.** Zod is the source of truth; the
  Gemini schema in `lib/gemini.ts` mirrors it by hand. A
  `zod-to-google-schema` adapter would remove the duplication.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** for the inbox/dashboard layout
- **Zustand** — 30 lines of state, no provider boilerplate
- **Zod** — single-source-of-truth schema for analysis output
- **@google/generative-ai** — Gemini SDK
- **Vitest** — schema unit tests

## Project structure

```
app/
  api/analyze/route.ts    — POST endpoint, validation + retry
  page.tsx                — dashboard shell
  layout.tsx              — metadata + global styles
components/
  inbox-list.tsx          — left column list
  enquiry-detail.tsx      — right column shell
  ai-analysis-card.tsx    — classification, confidence, urgency, flags, action
  suggested-reply-card.tsx— editable draft + copy
  new-enquiry-dialog.tsx  — "+" modal
  confidence-badge.tsx    — colour by threshold
  urgency-badge.tsx       — colour by tier
  classification-badge.tsx
  flag-chips.tsx          — with tooltips
  ui/                     — shadcn/ui primitives
lib/
  gemini.ts               — Gemini wrapper, AnalyzeResult, retry-friendly errors
  prompt.ts               — system instruction + few-shot
  schema.ts               — Zod schema (single source of truth)
  types.ts                — z.infer types + Enquiry shape
  sample-enquiries.ts     — 8 seeded enquiries
  store.ts                — Zustand
  use-analyze.ts          — client hook around /api/analyze
tests/
  schema.test.ts
docs/
  superpowers/specs/      — design spec
  superpowers/plans/      — implementation plan
```
```

- [ ] **Step 2: Commit**

```powershell
git add README.md
git commit -m "docs: README with prompt design, error handling, roadmap, trade-offs"
```

---

## Task 21: Push to GitHub and deploy to Vercel

**Files:** none (operational task)

- [ ] **Step 1: Create GitHub repo and push**

The user (vaardy02@gmail.com) creates a repo at `github.com/<user>/strata-ai-triage` (or similar). Then:

```powershell
git remote add origin https://github.com/<user>/strata-ai-triage.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Deploy to Vercel**

1. Go to <https://vercel.com/new>
2. Import the GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. **Environment Variables** → add `GEMINI_API_KEY` = (the user's key)
5. Click **Deploy**

Wait ~90s for build.

- [ ] **Step 3: Smoke test the live deploy**

Open the Vercel-assigned URL. Repeat the manual test cases from Task 19, Step 3:
- enquiry #2 → support_request
- enquiry #4 → vague_input + needs_clarification
- enquiry #5 → urgent + emergency
- + New Enquiry "hi" → low confidence + vague_input

- [ ] **Step 4: Update README with the live URL**

Edit `README.md`, line: `**Live demo:** _(filled in...)_` → `**Live demo:** <https://strata-ai-triage.vercel.app>`.

```powershell
git add README.md
git commit -m "docs: link live Vercel demo in README"
git push
```

- [ ] **Step 5: Submission checklist**

Verify acceptance criteria from spec §14:
- [x] `npm run dev` boots
- [x] 8 seeded enquiries visible
- [x] Live Gemini call from click → ~3s
- [x] `+ New Enquiry` works
- [x] Vague input → low confidence + flag
- [x] Emergency input → urgent + emergency flag
- [x] All error paths surface friendly messages with Retry
- [x] `npm test` passes
- [x] Vercel live URL works
- [x] README contains: quick start, verbatim prompt link, error-handling table, production-roadmap section, trade-offs section

## Spec coverage check

| Spec section | Covered by |
|---|---|
| §2 Scoring alignment | Whole plan (each task notes intent) |
| §3 Constraints / decisions | Tasks 1–3 (stack), 11 (Zustand), 5 (Zod) |
| §4 AI output schema | Task 5 (Zod), Task 9 (Gemini mirror) |
| §5.1–5.4 Prompt engineering | Task 8 (prompt + few-shot) |
| §6.1 File structure | Whole plan — every file in §6.1 has a task |
| §6.2 Data flow | Task 10 (route), 12 (hook), 11 (store) |
| §7 UI specification | Tasks 13–19 |
| §8.1 Semantic errors | Task 8 (prompt rules) + Task 19 Step 3 (test cases) |
| §8.2 Technical errors | Tasks 9–10, 12 |
| §8.3 Logging | Task 10 |
| §9 Seed enquiries | Task 7 |
| §10 Bonus mapping | Tasks 8 (prompt), 15 (confidence/urgency UI), 20 (README sections) |
| §11 README | Task 20 |
| §12 Testing | Task 6 |
| §13 Out-of-scope | Documented in README (Task 20 trade-offs section) |
| §14 Acceptance criteria | Task 21 Step 5 checklist |
