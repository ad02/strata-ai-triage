"use client";

import { create } from "zustand";
import { SAMPLE_ENQUIRIES } from "./sample-enquiries";
import type { Analysis, Enquiry } from "./types";

type State = {
  enquiries: Enquiry[];
  selectedId: string | null;
  select: (id: string | null) => void;
  addEnquiry: (input: { from: string; subject: string; body: string }) => string;
  setStatus: (id: string, status: Enquiry["analysis_status"]) => void;
  setAnalysis: (id: string, analysis: Analysis) => void;
  setError: (id: string, error: string) => void;
};

export const useStore = create<State>((set) => ({
  enquiries: SAMPLE_ENQUIRIES,
  selectedId: SAMPLE_ENQUIRIES[0]?.id ?? null,

  select: (id) => set({ selectedId: id }),

  addEnquiry: ({ from, subject, body }) => {
    const id = `u${Date.now()}`;
    set((s) => ({
      enquiries: [
        {
          id,
          received_at: new Date().toISOString(),
          from: from || "unknown",
          subject: subject || "(no subject)",
          body,
          analysis_status: { state: "idle" },
        },
        ...s.enquiries,
      ],
      selectedId: id,
    }));
    return id;
  },

  setStatus: (id, status) =>
    set((s) => ({
      enquiries: s.enquiries.map((e) =>
        e.id === id ? { ...e, analysis_status: status } : e,
      ),
    })),

  setAnalysis: (id, analysis) =>
    set((s) => ({
      enquiries: s.enquiries.map((e) =>
        e.id === id
          ? { ...e, analysis_status: { state: "done", analysis } }
          : e,
      ),
    })),

  setError: (id, error) =>
    set((s) => ({
      enquiries: s.enquiries.map((e) =>
        e.id === id
          ? { ...e, analysis_status: { state: "error", error } }
          : e,
      ),
    })),
}));
