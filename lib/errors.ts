/**
 * Friendly error formatting shared by the health indicator and the
 * useAnalyze hook. Gemini errors are usually JSON like
 *   {"error":{"code":429,"message":"...","status":"..."}}
 * — extract the human-readable message and recognise common categories.
 */

export function friendlyGeminiError(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    const msg: string | undefined = parsed?.error?.message ?? parsed?.message;
    if (typeof msg === "string") {
      const clean = msg.split("\n")[0].replace(/\s+/g, " ").trim();
      if (/prepayment|credit|billing/i.test(clean)) {
        return "Gemini API credits depleted — top up at aistudio.google.com.";
      }
      if (/quota|rate.?limit|exceeded/i.test(clean)) {
        return "Gemini quota hit — wait ~60s, or upgrade to paid tier.";
      }
      if (/api.?key/i.test(clean)) {
        return "Invalid GEMINI_API_KEY — check the server config.";
      }
      return truncate(clean, 160);
    }
  } catch {
    /* not JSON — fall through */
  }
  if (raw === "missing_api_key") return "GEMINI_API_KEY is not set on the server.";
  return truncate(raw, 160);
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
