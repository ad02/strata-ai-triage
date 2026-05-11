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
    void classification;
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
