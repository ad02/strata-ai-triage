import { GoogleGenAI, Type, type Schema } from "@google/genai";
import {
  AnalysisSchema,
  ClassificationEnum,
  FlagEnum,
  GeographyEnum,
  RouteToEnum,
  UrgencyEnum,
  validateBusinessRules,
  type Analysis,
} from "@/lib/schema";
import { systemInstruction } from "@/lib/prompt";

export const MODEL = "gemini-2.5-flash";
export const TIMEOUT_MS = 20_000;

// ─── Gemini responseSchema (derived from Zod enums for single SoT) ─────

const enumSchema = (values: readonly string[]): Schema => ({
  type: Type.STRING,
  format: "enum",
  enum: [...values],
});

export const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    classification: enumSchema(ClassificationEnum.options),
    classification_confidence: { type: Type.NUMBER },
    classification_reasoning: { type: Type.STRING },
    urgency: enumSchema(UrgencyEnum.options),
    geography: enumSchema(GeographyEnum.options),
    route_to: enumSchema(RouteToEnum.options),
    recommended_action: { type: Type.STRING },
    suggested_reply: {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
      },
      required: ["subject", "body"],
    },
    flags: {
      type: Type.ARRAY,
      items: enumSchema(FlagEnum.options),
    },
  },
  required: [
    "classification",
    "classification_confidence",
    "classification_reasoning",
    "urgency",
    "geography",
    "route_to",
    "recommended_action",
    "suggested_reply",
    "flags",
  ],
};

// ─── Result types ──────────────────────────────────────────────────────

export type AnalyzeErrorCode =
  | "missing_api_key"
  | "ai_timeout"
  | "rate_limit"
  | "ai_error"
  | "invalid_response"
  | "self_correction_failed";

export type AnalyzeMeta = {
  request_id: string;
  model: string;
  latency_ms: number;
  attempts: number;
  self_corrected: boolean;
};

export type AnalyzeResult =
  | { ok: true; analysis: Analysis; meta: AnalyzeMeta }
  | { ok: false; error: AnalyzeErrorCode; message: string; meta: AnalyzeMeta };

// ─── Lazy client (avoids crashing at import if key missing in dev) ─────

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// ─── Single Gemini call ────────────────────────────────────────────────

async function callGemini(
  enquiryText: string,
  ai: GoogleGenAI,
  correctiveNote?: string,
): Promise<unknown> {
  const userText = correctiveNote
    ? `${enquiryText}\n\n---\nNote: your previous response had this issue: ${correctiveNote}\nReturn a corrected JSON object.`
    : enquiryText;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: userText }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
        abortSignal: controller.signal,
      },
    });
    const text = response.text;
    if (!text) throw new Error("empty_response_text");
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public entry point ────────────────────────────────────────────────

/**
 * Analyse a single enquiry. Includes:
 * - Network-level retry: 1 retry on rate_limit / 5xx with 1.5s backoff
 * - AI self-correction: 1 retry if Zod validation OR business rules fail,
 *   sending the model a corrective note describing what went wrong.
 *
 * Logs metadata only (request_id, model, latency, attempts, classification,
 * confidence, flags) — never the enquiry body. See README "Privacy".
 */
export async function analyzeEnquiry(enquiryText: string): Promise<AnalyzeResult> {
  const start = performance.now();
  const requestId = crypto.randomUUID();
  const ai = getClient();

  const baseMeta = (attempts: number, selfCorrected: boolean): AnalyzeMeta => ({
    request_id: requestId,
    model: MODEL,
    latency_ms: Math.round(performance.now() - start),
    attempts,
    self_corrected: selfCorrected,
  });

  if (!ai) {
    return {
      ok: false,
      error: "missing_api_key",
      message: "GEMINI_API_KEY is not set on the server.",
      meta: baseMeta(0, false),
    };
  }

  let attempts = 0;
  let lastNetworkError: unknown = null;

  // Network-level: try once, retry once on transient error.
  for (let networkAttempt = 0; networkAttempt < 2; networkAttempt++) {
    try {
      attempts++;
      const raw = await callGemini(enquiryText, ai);

      // First Zod parse + business rules
      const parsed = AnalysisSchema.safeParse(raw);
      if (parsed.success) {
        const ruleViolation = validateBusinessRules(parsed.data);
        if (!ruleViolation) {
          logSuccess(requestId, parsed.data, baseMeta(attempts, false));
          return { ok: true, analysis: parsed.data, meta: baseMeta(attempts, false) };
        }
        // Self-correct: business rule violation
        attempts++;
        const correctedRaw = await callGemini(enquiryText, ai, ruleViolation);
        const corrected = AnalysisSchema.safeParse(correctedRaw);
        if (corrected.success && !validateBusinessRules(corrected.data)) {
          logSuccess(requestId, corrected.data, baseMeta(attempts, true));
          return { ok: true, analysis: corrected.data, meta: baseMeta(attempts, true) };
        }
        return {
          ok: false,
          error: "self_correction_failed",
          message: `Business-rule violation persisted after correction attempt: ${ruleViolation}`,
          meta: baseMeta(attempts, true),
        };
      }

      // Self-correct: Zod schema failure
      const zodError = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      attempts++;
      const correctedRaw = await callGemini(enquiryText, ai, `Schema validation failed: ${zodError}`);
      const corrected = AnalysisSchema.safeParse(correctedRaw);
      if (corrected.success && !validateBusinessRules(corrected.data)) {
        logSuccess(requestId, corrected.data, baseMeta(attempts, true));
        return { ok: true, analysis: corrected.data, meta: baseMeta(attempts, true) };
      }
      return {
        ok: false,
        error: "invalid_response",
        message: `Gemini returned a response that failed validation even after self-correction: ${zodError}`,
        meta: baseMeta(attempts, true),
      };
    } catch (err: unknown) {
      lastNetworkError = err;
      const code = classifyNetworkError(err);
      // Retry once on transient errors; fail-fast on others
      if (networkAttempt === 0 && (code === "rate_limit" || code === "ai_error")) {
        await sleep(1500);
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        error: code,
        message: msg,
        meta: baseMeta(attempts, false),
      };
    }
  }

  // Fall-through (shouldn't reach here)
  const msg = lastNetworkError instanceof Error ? lastNetworkError.message : "unknown error";
  return {
    ok: false,
    error: "ai_error",
    message: msg,
    meta: baseMeta(attempts, false),
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────

function classifyNetworkError(err: unknown): AnalyzeErrorCode {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("abort") || m.includes("timeout")) return "ai_timeout";
    if (m.includes("429") || m.includes("rate")) return "rate_limit";
  }
  return "ai_error";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function logSuccess(requestId: string, a: Analysis, meta: AnalyzeMeta): void {
  // Metadata only — NEVER log enquiry body or suggested_reply body (privacy)
  console.log(
    JSON.stringify({
      request_id: requestId,
      model: meta.model,
      latency_ms: meta.latency_ms,
      attempts: meta.attempts,
      self_corrected: meta.self_corrected,
      classification: a.classification,
      confidence: a.classification_confidence,
      urgency: a.urgency,
      geography: a.geography,
      route_to: a.route_to,
      flags: a.flags,
    }),
  );
}

/**
 * Lightweight liveness probe used by /api/health.
 * Returns true if the API key is set AND a minimal Gemini call succeeds.
 */
export async function probeGemini(): Promise<{ ok: boolean; latency_ms: number; error?: string }> {
  const start = performance.now();
  const ai = getClient();
  if (!ai) {
    return { ok: false, latency_ms: 0, error: "missing_api_key" };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        config: {
          abortSignal: controller.signal,
          maxOutputTokens: 1,
        },
      });
      return { ok: true, latency_ms: Math.round(performance.now() - start) };
    } finally {
      clearTimeout(timer);
    }
  } catch (err: unknown) {
    return {
      ok: false,
      latency_ms: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
