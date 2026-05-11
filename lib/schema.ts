import { z } from "zod";

export const Classification = z.enum([
  "new_client",
  "support_request",
  "complaint",
  "general_question",
]);

export const Urgency = z.enum(["low", "medium", "high", "urgent"]);

export const Sentiment = z.enum([
  "neutral",
  "frustrated",
  "angry",
  "appreciative",
  "anxious",
]);

export const SenderRole = z.enum([
  "owner",
  "tenant",
  "agent",
  "tradesperson",
  "committee",
  "unknown",
]);

export const RouteTo = z.enum([
  "front_desk",
  "accounts",
  "maintenance",
  "strata_manager",
  "committee",
  "legal",
]);

export const Flag = z.enum([
  "vague_input",
  "needs_clarification",
  "out_of_scope",
  "emergency",
  "legal_review_needed",
]);

export const Entities = z.object({
  lot_number: z.string().optional(),
  building_or_address: z.string().optional(),
  sender_role: SenderRole.optional(),
  deadline_mentioned: z.string().optional(),
});

export const SuggestedReply = z.object({
  subject: z.string(),
  body: z.string(),
});

export const AnalysisSchema = z.object({
  classification: Classification,
  classification_confidence: z.number().min(0).max(1),
  classification_reasoning: z.string(),
  urgency: Urgency,
  sentiment: Sentiment,
  key_topics: z.array(z.string()),
  entities: Entities,
  route_to: RouteTo,
  recommended_action: z.string(),
  suggested_reply: SuggestedReply,
  flags: z.array(Flag),
});
