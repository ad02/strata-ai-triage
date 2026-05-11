"use client";

import { useCallback } from "react";
import { useEnquiryStore } from "@/lib/store";

const FRIENDLY_MESSAGES: Record<string, string> = {
  missing_api_key: "The Gemini API key isn't configured on the server. Ask the admin to set GEMINI_API_KEY.",
  ai_timeout: "Gemini took too long to respond. Try again in a moment.",
  rate_limit: "We've hit Gemini's rate limit. Wait ~60 seconds and retry.",
  ai_error: "Gemini returned an error. Try again or check the server logs.",
  invalid_response: "Gemini returned an unexpected shape. Try again — the self-correction loop already retried once.",
  self_correction_failed: "Gemini's response violated business rules even after a corrective retry.",
  bad_request: "The enquiry text is empty or too long.",
};

/**
 * Client hook to analyze an enquiry. Posts to /api/analyze, drives the
 * Zustand store. For UI, just call analyze(id, text) and read state from
 * the store.
 */
export function useAnalyze() {
  const setStatus = useEnquiryStore((s) => s.setStatus);
  const setAnalysis = useEnquiryStore((s) => s.setAnalysis);
  const setError = useEnquiryStore((s) => s.setError);

  return useCallback(
    async (id: string, enquiryText: string): Promise<void> => {
      setStatus(id, "analyzing");
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enquiry_text: enquiryText }),
        });
        const json = await res.json();
        if (json.ok) {
          setAnalysis(id, json.analysis);
        } else {
          const msg = FRIENDLY_MESSAGES[json.error] ?? json.message ?? "Unknown error.";
          setError(id, msg);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error.";
        setError(id, msg);
      }
    },
    [setStatus, setAnalysis, setError],
  );
}
