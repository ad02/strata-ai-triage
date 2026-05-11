import { NextResponse } from "next/server";
import { analyzeEnquiry, type AnalyzeErrorCode } from "@/lib/gemini";

export const runtime = "nodejs"; // @google/genai uses Node APIs
export const dynamic = "force-dynamic"; // never cache analysis responses

const MAX_LEN = 10_000;

const STATUS_BY_ERROR: Record<AnalyzeErrorCode, number> = {
  missing_api_key: 503,
  ai_timeout: 504,
  rate_limit: 429,
  ai_error: 500,
  invalid_response: 502,
  self_correction_failed: 502,
};

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "Body must be valid JSON." },
      { status: 400 },
    );
  }

  const text =
    typeof body === "object" && body !== null && "enquiry_text" in body
      ? (body as { enquiry_text: unknown }).enquiry_text
      : undefined;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "enquiry_text must be a non-empty string." },
      { status: 400 },
    );
  }
  if (text.length > MAX_LEN) {
    return NextResponse.json(
      {
        ok: false,
        error: "bad_request",
        message: `enquiry_text exceeds ${MAX_LEN} characters.`,
      },
      { status: 413 },
    );
  }

  const result = await analyzeEnquiry(text);

  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }
  return NextResponse.json(result, { status: STATUS_BY_ERROR[result.error] ?? 500 });
}
