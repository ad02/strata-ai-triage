import { z } from "zod";

// ─── Enums ─────────────────────────────────────────────────────────────

export const ClassificationEnum = z.enum([
  "seller_enquiry",      // owner exploring sale, retirement, exit
  "buyer_enquiry",       // operator or PE firm looking to acquire
  "valuation_request",   // wants a valuation, not necessarily selling
  "general_question",    // fees, process, geography, timeline
  "referral_partner",    // accountant/lawyer/advisor introduction
]);

export const UrgencyEnum = z.enum(["low", "medium", "high", "urgent"]);

export const GeographyEnum = z.enum([
  "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "unspecified",
]);

export const RouteToEnum = z.enum([
  "intake",            // initial qualification, vague enquiries
  "senior_broker",     // qualified seller/buyer engagements
  "valuation",         // portfolio appraisal requests
  "principal",         // high-value, confidentiality-sensitive
  "partner_referral",  // accountant/lawyer/advisor introductions
]);

export const FlagEnum = z.enum([
  "vague_input",
  "needs_clarification",
  "out_of_scope",
  "confidentiality_required",
  "high_value_lead",
]);

// ─── Suggested reply (nested object) ───────────────────────────────────

export const SuggestedReplySchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
});

// ─── Full analysis schema (single source of truth) ─────────────────────

export const AnalysisSchema = z.object({
  classification: ClassificationEnum,
  classification_confidence: z.number().min(0).max(1),
  classification_reasoning: z.string().min(1).max(300),

  urgency: UrgencyEnum,
  geography: GeographyEnum,
  route_to: RouteToEnum,

  recommended_action: z.string().min(1).max(500),
  suggested_reply: SuggestedReplySchema,

  flags: z.array(FlagEnum),
});

// ─── Inferred TypeScript types ─────────────────────────────────────────

export type Classification = z.infer<typeof ClassificationEnum>;
export type Urgency = z.infer<typeof UrgencyEnum>;
export type Geography = z.infer<typeof GeographyEnum>;
export type RouteTo = z.infer<typeof RouteToEnum>;
export type Flag = z.infer<typeof FlagEnum>;
export type SuggestedReply = z.infer<typeof SuggestedReplySchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;

// ─── Business-rule validators (used by the AI self-correction loop) ────

/**
 * Returns null if the analysis is internally consistent, or a string
 * describing the violation. Used by the Gemini wrapper to decide whether
 * to ask the model for a corrected response.
 */
export function validateBusinessRules(a: Analysis): string | null {
  if (a.classification_confidence < 0.7 && !a.flags.includes("needs_clarification")) {
    return `Confidence ${a.classification_confidence.toFixed(2)} is below 0.7 but "needs_clarification" flag is missing. Add the flag.`;
  }
  if (a.flags.includes("out_of_scope") && a.urgency !== "low") {
    return `Out-of-scope enquiries should have urgency "low" (got "${a.urgency}").`;
  }
  if (a.flags.includes("high_value_lead") && a.route_to !== "principal" && a.route_to !== "senior_broker") {
    return `high_value_lead should route to "principal" or "senior_broker" (got "${a.route_to}").`;
  }
  return null;
}
