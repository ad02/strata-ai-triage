import { NextResponse } from "next/server";
import { probeGemini, MODEL } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Returns 200 if GEMINI_API_KEY is set AND a minimal probe call succeeds.
 * Returns 503 otherwise. Used by the dashboard header indicator.
 */
export async function GET(): Promise<Response> {
  const probe = await probeGemini();
  return NextResponse.json(
    {
      status: probe.ok ? "ok" : "degraded",
      model: MODEL,
      latency_ms: probe.latency_ms,
      ...(probe.error ? { error: probe.error } : {}),
      timestamp: new Date().toISOString(),
    },
    { status: probe.ok ? 200 : 503 },
  );
}
