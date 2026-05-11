import { describe, it, expect } from "vitest";
import { validateBusinessRules, type Analysis } from "@/lib/schema";

const base: Analysis = {
  classification: "seller_enquiry",
  classification_confidence: 0.95,
  classification_reasoning: "test",
  urgency: "medium",
  geography: "NSW",
  route_to: "senior_broker",
  recommended_action: "test",
  suggested_reply: { subject: "x", body: "x" },
  flags: [],
};

describe("validateBusinessRules", () => {
  it("returns null for a clean analysis", () => {
    expect(validateBusinessRules(base)).toBeNull();
  });

  it("flags low confidence without needs_clarification", () => {
    const violation = validateBusinessRules({
      ...base,
      classification_confidence: 0.5,
      flags: [],
    });
    expect(violation).toMatch(/below 0.7/);
    expect(violation).toMatch(/needs_clarification/);
  });

  it("accepts low confidence WITH needs_clarification flag", () => {
    expect(
      validateBusinessRules({
        ...base,
        classification_confidence: 0.4,
        flags: ["needs_clarification"],
      }),
    ).toBeNull();
  });

  it("flags out_of_scope with non-low urgency", () => {
    const violation = validateBusinessRules({
      ...base,
      urgency: "urgent",
      flags: ["out_of_scope"],
    });
    expect(violation).toMatch(/out-of-scope/i);
    expect(violation).toMatch(/low/i);
  });

  it("flags high_value_lead routed to a non-senior role", () => {
    const violation = validateBusinessRules({
      ...base,
      route_to: "intake",
      flags: ["high_value_lead"],
    });
    expect(violation).toMatch(/high_value_lead/);
    expect(violation).toMatch(/principal|senior_broker/);
  });

  it("accepts high_value_lead routed to principal", () => {
    expect(
      validateBusinessRules({
        ...base,
        route_to: "principal",
        flags: ["high_value_lead"],
      }),
    ).toBeNull();
  });
});
