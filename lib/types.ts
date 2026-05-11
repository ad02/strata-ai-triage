import type { z } from "zod";
import type {
  AnalysisSchema,
  Classification,
  Urgency,
  Sentiment,
  Flag,
  RouteTo,
} from "./schema";

export type Analysis = z.infer<typeof AnalysisSchema>;
export type ClassificationT = z.infer<typeof Classification>;
export type UrgencyT = z.infer<typeof Urgency>;
export type SentimentT = z.infer<typeof Sentiment>;
export type FlagT = z.infer<typeof Flag>;
export type RouteToT = z.infer<typeof RouteTo>;

export type AnalysisStatus =
  | { state: "idle" }
  | { state: "analyzing" }
  | { state: "done"; analysis: Analysis }
  | { state: "error"; error: string };

export type Enquiry = {
  id: string;
  received_at: string;
  from: string;
  subject: string;
  body: string;
  analysis_status: AnalysisStatus;
};
