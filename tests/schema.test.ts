import { describe, it, expect } from "vitest";
import { AnalysisSchema, type Analysis } from "@/lib/schema";

const validAnalysis: Analysis = {
  classification: "seller_enquiry",
  classification_confidence: 0.92,
  classification_reasoning: "Owner mentions exit planning with portfolio details.",
  urgency: "high",
  geography: "NSW",
  route_to: "senior_broker",
  recommended_action: "Reply within 24 hours to schedule a discovery call.",
  suggested_reply: {
    subject: "Re: your enquiry",
    body: "Thank you for reaching out. We can arrange a call next week...",
  },
  flags: [],
};

describe("AnalysisSchema", () => {
  it("accepts a well-formed analysis", () => {
    expect(AnalysisSchema.safeParse(validAnalysis).success).toBe(true);
  });

  it("rejects confidence outside [0,1]", () => {
    const result = AnalysisSchema.safeParse({
      ...validAnalysis,
      classification_confidence: 1.2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown classification value", () => {
    const result = AnalysisSchema.safeParse({
      ...validAnalysis,
      classification: "lottery_winner",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown flag value", () => {
    const result = AnalysisSchema.safeParse({
      ...validAnalysis,
      flags: ["totally_made_up_flag"],
    });
    expect(result.success).toBe(false);
  });

  it("requires both subject and body in suggested_reply", () => {
    const result = AnalysisSchema.safeParse({
      ...validAnalysis,
      suggested_reply: { subject: "Re: your enquiry" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty flags array", () => {
    expect(AnalysisSchema.safeParse({ ...validAnalysis, flags: [] }).success).toBe(true);
  });

  it("accepts geography 'unspecified'", () => {
    expect(
      AnalysisSchema.safeParse({ ...validAnalysis, geography: "unspecified" }).success,
    ).toBe(true);
  });
});
