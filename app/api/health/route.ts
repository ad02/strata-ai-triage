import { NextResponse } from "next/server";
import { probeGemini, MODEL } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Returns 200 if GEMINI_API_KEY is set AND a recent Gemini probe succeeded.
 * Returns 503 otherwise.
 *
 * The actual Gemini probe is **server-side cached for 5 minutes** so that
 * 60-second client polling doesn't burn the daily quota — at most ~12
 * real probes/hour, regardless of how many dashboards are open.
 *
 * Pass `?fresh=1` to force a re-probe (used on initial mount).
 */

type CachedProbe = {
  ok: boolean;
  latency_ms: number;
  error?: string;
  cached_at: number; // ms epoch
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
let cached: CachedProbe | null = null;

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const forceFresh = url.searchParams.get("fresh") === "1";
  const now = Date.now();

  let probe: { ok: boolean; latency_ms: number; error?: string };
  let fromCache = false;

  if (!forceFresh && cached && now - cached.cached_at < CACHE_TTL_MS) {
    probe = { ok: cached.ok, latency_ms: cached.latency_ms, error: cached.error };
    fromCache = true;
  } else {
    probe = await probeGemini();
    cached = { ...probe, cached_at: now };
  }

  return NextResponse.json(
    {
      status: probe.ok ? "ok" : "degraded",
      model: MODEL,
      latency_ms: probe.latency_ms,
      cached: fromCache,
      ...(probe.error ? { error: probe.error } : {}),
      timestamp: new Date().toISOString(),
    },
    { status: probe.ok ? 200 : 503 },
  );
}
