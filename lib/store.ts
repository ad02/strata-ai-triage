import { create } from "zustand";
import type { Analysis } from "@/lib/schema";
import { sampleEnquiries, type Enquiry } from "@/lib/sample-enquiries";
import { seededAnalyses } from "@/lib/seeded-analyses";

export type AnalysisStatus = "idle" | "analyzing" | "done" | "error";

type EnquiryState = {
  // ─── State ──────────────────────────────────────────────────────────
  enquiries: Enquiry[];
  selectedId: string | null;
  analyses: Record<string, Analysis>;
  statuses: Record<string, AnalysisStatus>;
  errors: Record<string, string>;

  // ─── Selectors ──────────────────────────────────────────────────────
  selectedEnquiry: () => Enquiry | undefined;
  selectedAnalysis: () => Analysis | undefined;
  selectedStatus: () => AnalysisStatus;
  selectedError: () => string | undefined;

  // ─── Actions ────────────────────────────────────────────────────────
  selectEnquiry: (id: string) => void;
  addEnquiry: (enq: Enquiry) => void;
  setStatus: (id: string, status: AnalysisStatus) => void;
  setAnalysis: (id: string, analysis: Analysis) => void;
  setError: (id: string, error: string) => void;
};

// Seeded enquiries get status "done" immediately (cached analyses are
// loaded as initial state); pre-pasted ones start as "idle".
const initialStatuses: Record<string, AnalysisStatus> = {};
for (const e of sampleEnquiries) {
  initialStatuses[e.id] = seededAnalyses[e.id] ? "done" : "idle";
}

export const useEnquiryStore = create<EnquiryState>((set, get) => ({
  enquiries: sampleEnquiries,
  selectedId: sampleEnquiries[0]?.id ?? null,
  analyses: { ...seededAnalyses },
  statuses: initialStatuses,
  errors: {},

  selectedEnquiry: () => get().enquiries.find((e) => e.id === get().selectedId),
  selectedAnalysis: () => {
    const id = get().selectedId;
    return id ? get().analyses[id] : undefined;
  },
  selectedStatus: () => {
    const id = get().selectedId;
    return id ? (get().statuses[id] ?? "idle") : "idle";
  },
  selectedError: () => {
    const id = get().selectedId;
    return id ? get().errors[id] : undefined;
  },

  selectEnquiry: (id) => set({ selectedId: id }),

  addEnquiry: (enq) =>
    set((s) => ({
      enquiries: [enq, ...s.enquiries],
      selectedId: enq.id,
      statuses: { ...s.statuses, [enq.id]: "idle" },
    })),

  setStatus: (id, status) =>
    set((s) => ({ statuses: { ...s.statuses, [id]: status } })),

  setAnalysis: (id, analysis) =>
    set((s) => ({
      analyses: { ...s.analyses, [id]: analysis },
      statuses: { ...s.statuses, [id]: "done" },
      errors: { ...s.errors, [id]: "" },
    })),

  setError: (id, error) =>
    set((s) => ({
      statuses: { ...s.statuses, [id]: "error" },
      errors: { ...s.errors, [id]: error },
    })),
}));
