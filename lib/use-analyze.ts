"use client";

import { useStore } from "./store";
import type { Analysis } from "./types";

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
      const data = (await res.json()) as { analysis: Analysis };
      setAnalysis(enquiryId, data.analysis);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error.";
      setError(enquiryId, msg);
    }
  };
}
