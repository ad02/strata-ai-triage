import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AnalysisSchema } from "./schema";
import { SYSTEM_INSTRUCTION } from "./prompt";
import type { Analysis } from "./types";

const MODEL_ID = "gemini-1.5-flash";
const TIMEOUT_MS = 20_000;

// Mirrors the Zod schema in lib/schema.ts. Both files must change together;
// Zod remains the single source of truth.
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
          enum: [
            "owner",
            "tenant",
            "agent",
            "tradesperson",
            "committee",
            "unknown",
          ],
        },
        deadline_mentioned: { type: SchemaType.STRING },
      },
    },
    route_to: {
      type: SchemaType.STRING,
      enum: [
        "front_desk",
        "accounts",
        "maintenance",
        "strata_manager",
        "committee",
        "legal",
      ],
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
  | {
      ok: true;
      analysis: Analysis;
      meta: { latency_ms: number; model: string };
    }
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

export async function analyzeEnquiry(
  enquiryText: string,
): Promise<AnalyzeResult> {
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
