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

  // First attempt + one retry on transient errors
  let result = await analyzeEnquiry(text);
  if (
    !result.ok &&
    (result.error === "rate_limit" || result.error === "ai_error")
  ) {
    await new Promise((r) => setTimeout(r, 1500));
    result = await analyzeEnquiry(text);
  }

  if (!result.ok) {
    const status =
      result.error === "missing_api_key"
        ? 503
        : result.error === "ai_timeout"
          ? 504
          : result.error === "rate_limit"
            ? 429
            : result.error === "invalid_response"
              ? 502
              : 500;

    // Privacy: log meta only, not enquiry content
    console.error("[analyze]", { error: result.error, detail: result.detail });

    return NextResponse.json({ error: result.error }, { status });
  }

  console.log("[analyze]", {
    model: result.meta.model,
    latency_ms: result.meta.latency_ms,
    classification: result.analysis.classification,
    confidence: result.analysis.classification_confidence,
    flags: result.analysis.flags,
  });

  return NextResponse.json({ analysis: result.analysis });
}
