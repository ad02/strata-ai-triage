import type { Analysis } from "@/lib/schema";

/**
 * Four few-shot examples taught to Gemini in the system instruction.
 *
 * Distribution chosen for learning the *shape* of outputs:
 *   1. Common-case (clean buyer enquiry) — teaches the modal path
 *   2. Vague seller — teaches "don't guess, ask for the three qualifying facts"
 *   3. Out-of-scope domain confusion — teaches domain boundaries
 *   4. High-value confidential seller — teaches recognition of high-stakes signals
 *
 * One per pattern, not one per classification — pattern coverage matters
 * more than enum coverage for prompt generalisation.
 */

export type FewShot = {
  description: string;   // human note for maintainers — not sent to Gemini
  input: string;
  output: Analysis;
};

export const fewShotExamples: FewShot[] = [
  {
    description: "Common case — clean buyer enquiry, high confidence, routed cleanly",
    input: `Hi — I run a 5,000-lot strata management business in Brisbane (Capital Strata Group). We're looking to acquire a 1,000–2,500 lot portfolio in SE QLD over the next 12 months. Can you let me know what's currently coming to market? Happy to sign an NDA. Helen Park, Director.`,
    output: {
      classification: "buyer_enquiry",
      classification_confidence: 0.95,
      classification_reasoning: "Existing operator with stated portfolio size, geography, and acquisition criteria.",
      urgency: "high",
      geography: "QLD",
      route_to: "senior_broker",
      recommended_action: "Reply within 24 hours; offer NDA and an initial buyer-criteria call. Add to active buy-side list for SE QLD opportunities.",
      suggested_reply: {
        subject: "Re: SE QLD acquisition opportunities",
        body: `Hi Helen,

Thanks for getting in touch. We're working with several SE QLD operators currently exploring exits and would be happy to discuss what may be a fit for Capital Strata Group's profile.

I'll send through our standard mutual NDA shortly. Once that's in place, we can arrange a 30-minute call to walk through your acquisition criteria in more detail and review what's on the active list.

Best to call you on which number?

Kind regards,
The Strata Business Brokers Team`,
      },
      flags: [],
    },
  },

  {
    description: "Vague — seller signal but no detail; ask the three qualifying facts",
    input: `hi can you call me back about selling thx`,
    output: {
      classification: "seller_enquiry",
      classification_confidence: 0.35,
      classification_reasoning: "Mentions \"selling\" but provides no portfolio, geography, or context.",
      urgency: "low",
      geography: "unspecified",
      route_to: "intake",
      recommended_action: "Reply with three qualifying questions before booking a call: portfolio size, geography, and timeline.",
      suggested_reply: {
        subject: "Re: your enquiry",
        body: `Hi,

Thanks for reaching out. So we can prepare for a useful call, would you mind sharing a few quick details:

1. Approximately how many lots does your business currently manage?
2. Which state or region is the portfolio concentrated in?
3. Roughly what timeline are you considering for an exit?

Once we have those, we can get a meaningful conversation organised quickly.

Kind regards,
The Strata Business Brokers Team`,
      },
      flags: ["vague_input", "needs_clarification"],
    },
  },

  {
    description: "Out of scope — residential property sale, NOT a strata-management business",
    input: `Hi, I want to sell my 2-bedroom apartment in North Bondi. What kind of fees do you charge?`,
    output: {
      classification: "general_question",
      classification_confidence: 0.92,
      classification_reasoning: "Wants to sell a residential apartment; we broker strata-management businesses, not residential property.",
      urgency: "low",
      geography: "NSW",
      route_to: "intake",
      recommended_action: "Reply with polite redirect — we are an M&A brokerage for strata-management agencies, not a residential agent.",
      suggested_reply: {
        subject: "Re: your enquiry",
        body: `Hi,

Thanks for getting in touch. To clarify — Strata Business Brokers specialises in the sale of strata management businesses (the agencies that administer apartment buildings on behalf of Owners Corporations), not residential property sales.

For selling your apartment in North Bondi you would want to speak with a residential real estate agent. The local REINSW directory at reinsw.com.au can help you find one with strong recent results in your area.

Wishing you a successful sale.

The Strata Business Brokers Team`,
      },
      flags: ["out_of_scope"],
    },
  },

  {
    description: "High-value confidential seller — large portfolio + confidentiality signal → escalate to principal",
    input: `Good afternoon. I'm the founder of a strata management business with approximately 4,500 lots across NSW (concentrated in the North Shore and Eastern Suburbs). I'd like to start exploring a sale process. Critically, this needs to be handled with maximum discretion — none of my staff or current clients can become aware that this is being explored. How do you typically manage confidentiality during the early stages?`,
    output: {
      classification: "seller_enquiry",
      classification_confidence: 0.97,
      classification_reasoning: "Founder of a 4,500-lot NSW agency exploring sale with explicit confidentiality requirement.",
      urgency: "high",
      geography: "NSW",
      route_to: "principal",
      recommended_action: "Principal-level handling. Acknowledge confidentiality, outline the CIM and exclusive engagement process, request preferred private contact channel before any further detail.",
      suggested_reply: {
        subject: "Re: your enquiry — confidential",
        body: `Good afternoon,

Thank you for reaching out, and your concern about discretion is well placed — confidentiality is the most common requirement in our seller engagements and we have an established process for it.

In short: we use a coded Confidential Information Memorandum (CIM) that does not name your business, and we only release identifying detail after qualified buyers have signed both an NDA and our exclusivity engagement. Staff and client awareness is managed by limiting all communications to a private channel of your choosing.

I'd suggest a brief 20-minute introductory call. Could you share a private mobile number and a window that works, and I'll arrange it directly with our principal broker?

Kind regards,
The Strata Business Brokers Team`,
      },
      flags: ["confidentiality_required", "high_value_lead"],
    },
  },
];
