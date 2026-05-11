import type { RouteTo } from "@/lib/schema";

/**
 * Static team directory.
 *
 * Names sourced from the public team page at
 * https://stratabusinessbrokers.com.au/team/ as of 2026-05-11.
 * Emails are placeholders (example.com) — this is a demo.
 *
 * The AI returns a *role* (`route_to`); this map turns the role into a
 * person. In production the mapping would come from the CRM / Active
 * Directory; for a 3-person boutique multiple roles map to the founder.
 * The schema stays general so this directory can swap with no AI changes.
 */
export type TeamMember = {
  name: string;
  title: string;
  email: string;
  /** Why this role maps to this person at this firm size. */
  note: string;
};

export const team: Record<RouteTo, TeamMember> = {
  intake: {
    name: "Ross Competente",
    title: "Assistant Business Broker",
    email: "ross@example.com",
    note: "First-response qualification and information gathering",
  },
  senior_broker: {
    name: "David Lin",
    title: "Director & Principal Broker",
    email: "david@example.com",
    note: "Qualified seller and buyer engagements",
  },
  valuation: {
    name: "David Lin",
    title: "Director & Principal Broker",
    email: "david@example.com",
    note: "Portfolio appraisals (at scale: dedicated valuation analyst)",
  },
  principal: {
    name: "David Lin",
    title: "Director & Principal Broker",
    email: "david@example.com",
    note: "High-value or confidentiality-sensitive matters",
  },
  partner_referral: {
    name: "Ross Competente",
    title: "Assistant Business Broker",
    email: "ross@example.com",
    note: "Accountant, lawyer, and advisor referrals",
  },
};

/**
 * Resolve a team member by role with a safe fallback.
 * If the AI returns a role we don't know about (shouldn't happen given
 * Zod validation, but defensive), fall back to intake.
 */
export function getTeamMember(role: RouteTo | string): TeamMember {
  return team[role as RouteTo] ?? team.intake;
}
