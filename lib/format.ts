import type { Classification, Flag, Urgency, Geography } from "@/lib/schema";

// ─── Time ──────────────────────────────────────────────────────────────

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

// ─── Classification ────────────────────────────────────────────────────

const CLASSIFICATION_LABELS: Record<Classification, string> = {
  seller_enquiry: "Seller",
  buyer_enquiry: "Buyer",
  valuation_request: "Valuation",
  general_question: "General",
  referral_partner: "Referral",
};

export const classificationLabel = (c: Classification): string => CLASSIFICATION_LABELS[c];

const CLASSIFICATION_COLORS: Record<Classification, string> = {
  seller_enquiry: "bg-emerald-500",
  buyer_enquiry: "bg-blue-500",
  valuation_request: "bg-violet-500",
  general_question: "bg-slate-400",
  referral_partner: "bg-amber-500",
};

export const classificationDotColor = (c: Classification): string => CLASSIFICATION_COLORS[c];

// ─── Urgency ───────────────────────────────────────────────────────────

const URGENCY_LABELS: Record<Urgency, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const urgencyLabel = (u: Urgency): string => URGENCY_LABELS[u];

const URGENCY_BADGE_CLASS: Record<Urgency, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  urgent: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300",
};

export const urgencyBadgeClass = (u: Urgency): string => URGENCY_BADGE_CLASS[u];

// ─── Geography ─────────────────────────────────────────────────────────

const GEOGRAPHY_LABELS: Record<Geography, string> = {
  NSW: "NSW",
  VIC: "VIC",
  QLD: "QLD",
  WA: "WA",
  SA: "SA",
  TAS: "TAS",
  ACT: "ACT",
  NT: "NT",
  unspecified: "—",
};

export const geographyLabel = (g: Geography): string => GEOGRAPHY_LABELS[g];

// ─── Confidence ────────────────────────────────────────────────────────

export function confidenceTone(c: number): { label: string; className: string } {
  if (c >= 0.9)
    return { label: "High", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" };
  if (c >= 0.7)
    return { label: "Medium", className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300" };
  return { label: "Low", className: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300" };
}

// ─── Flags ─────────────────────────────────────────────────────────────

const FLAG_LABELS: Record<Flag, string> = {
  vague_input: "Vague input",
  needs_clarification: "Needs clarification",
  out_of_scope: "Out of scope",
  confidentiality_required: "Confidential",
  high_value_lead: "High-value lead",
};

export const flagLabel = (f: Flag): string => FLAG_LABELS[f];

const FLAG_DESCRIPTIONS: Record<Flag, string> = {
  vague_input: "Too little detail to action confidently.",
  needs_clarification: "Confidence below 0.7 or multiple equally-likely interpretations.",
  out_of_scope: "Not strata-business-broking related.",
  confidentiality_required: "Seller signals discretion needed (staff/clients must not know).",
  high_value_lead: "Large portfolio (>2,000 lots), PE firm, or other significant signal.",
};

export const flagDescription = (f: Flag): string => FLAG_DESCRIPTIONS[f];

const FLAG_TONE: Record<Flag, string> = {
  vague_input: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  needs_clarification: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  out_of_scope: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  confidentiality_required: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-300",
  high_value_lead: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
};

export const flagToneClass = (f: Flag): string => FLAG_TONE[f];

// ─── Routing ───────────────────────────────────────────────────────────

const ROUTE_LABELS = {
  intake: "Intake",
  senior_broker: "Senior Broker",
  valuation: "Valuation",
  principal: "Principal",
  partner_referral: "Partner Referral",
} as const;

export const routeLabel = (r: keyof typeof ROUTE_LABELS): string => ROUTE_LABELS[r];
