import type { Enquiry } from "./types";

const now = Date.now();
const ago = (mins: number) =>
  new Date(now - mins * 60_000).toISOString();

export const SAMPLE_ENQUIRIES: Enquiry[] = [
  {
    id: "e1",
    received_at: ago(8),
    from: "Sarah Mitchell <chair@bondi14.example.com>",
    subject: "Considering switching strata managers",
    body: `Hi,

We're the owners corporation of a 14-unit residential building in Bondi.
We've been with our current strata manager for four years and the
committee is unhappy with response times and the recent levy increase
process.

Could you send through your onboarding process, typical fee structure
for a building our size, and what would be involved in transferring
the records? An initial chat would be welcome too.

Regards,
Sarah Mitchell
Chair, SP 28491`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e2",
    received_at: ago(34),
    from: "David Chen <david.chen@example.com>",
    subject: "Section 184 certificate - Lot 7",
    body: `Hello,

I'm selling Lot 7 at 22 Edith St, Newtown. Settlement is scheduled
for 28 May. My conveyancer needs a Section 184 certificate and any
relevant disclosure documents.

Can you confirm the cost and turnaround time, and let me know how to
pay?

Thanks,
David Chen
Lot 7`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e3",
    received_at: ago(76),
    from: "jenny.r@gmail.com",
    subject: "Noise complaint - Unit 12",
    body: `The people in Unit 12 have been running their washing machine
every night around 11pm for the past two weeks. I've left two notes
under their door asking them to stop and nothing has changed. I have
a baby and this is becoming unbearable.

What are the by-laws around this and can the committee do something?

Jenny`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e4",
    received_at: ago(120),
    from: "unknown",
    subject: "(no subject)",
    body: `hi can someone call me back thx`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e5",
    received_at: ago(3),
    from: "Tom Patel <tom.p@example.com>",
    subject: "URGENT - Water through ceiling Lot 22",
    body: `WATER POURING THROUGH MY CEILING FROM UNIT ABOVE.
NOBODY ANSWERING UNIT 23. CARPETS RUINED. THIS IS THE SECOND TIME
THIS YEAR. Please send someone NOW.

Tom, Lot 22, 88 Church St Parramatta`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e6",
    received_at: ago(180),
    from: "Rebecca Lim <rlim@belleproperty.example.com>",
    subject: "Levy balance enquiry - Lot 4, 15 Marine Pde",
    body: `Hi team,

Could you please confirm the current levy balance and any outstanding
special levies for Lot 4, 15 Marine Parade, for an upcoming sale
campaign? Buyer's solicitor has asked.

Many thanks,
Rebecca Lim
Belle Property`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e7",
    received_at: ago(360),
    from: "Mark Davies <mark.d@example.com>",
    subject: "AGM scheduling",
    body: `Hi,

When is this year's AGM scheduled? Last year's minutes mentioned May
but I haven't seen a notice yet. Also, what's the deadline for
submitting motions?

Mark
Committee member, SP 11203`,
    analysis_status: { state: "idle" },
  },
  {
    id: "e8",
    received_at: ago(720),
    from: "sender@example.com",
    subject: "Selling my apartment",
    body: `Hi, I'm thinking about selling my apartment this year and
wondering what the market looks like in 2026. Could you give me
some advice on pricing and timing?

Cheers`,
    analysis_status: { state: "idle" },
  },
];
