"use client";

import { useEnquiryStore } from "@/lib/store";
import {
  classificationDotColor,
  classificationLabel,
  formatRelativeTime,
} from "@/lib/format";
import { AlertCircle, Loader2 } from "lucide-react";

export function InboxList() {
  const enquiries = useEnquiryStore((s) => s.enquiries);
  const selectedId = useEnquiryStore((s) => s.selectedId);
  const analyses = useEnquiryStore((s) => s.analyses);
  const statuses = useEnquiryStore((s) => s.statuses);
  const select = useEnquiryStore((s) => s.selectEnquiry);

  return (
    <ul className="divide-y">
      {enquiries.map((enq) => {
        const analysis = analyses[enq.id];
        const status = statuses[enq.id];
        const isSelected = enq.id === selectedId;
        return (
          <li key={enq.id}>
            <button
              type="button"
              onClick={() => select(enq.id)}
              className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors ${
                isSelected ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-1.5">
                  {analysis ? (
                    <span
                      className={`block h-2 w-2 rounded-full ${classificationDotColor(analysis.classification)}`}
                      aria-hidden
                    />
                  ) : status === "analyzing" ? (
                    <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                  ) : status === "error" ? (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  ) : (
                    <span className="block h-2 w-2 rounded-full bg-slate-300" aria-hidden />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate">{enq.from_name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(enq.received_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{enq.subject}</p>
                  {analysis && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {classificationLabel(analysis.classification)}
                      </span>
                      {analysis.flags.includes("high_value_lead") && (
                        <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                          ★ HVL
                        </span>
                      )}
                      {analysis.urgency === "urgent" && (
                        <span className="text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold">
                          URGENT
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
