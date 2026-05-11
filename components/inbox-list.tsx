"use client";

import { useEnquiryStore } from "@/lib/store";
import {
  classificationDotColor,
  classificationLabel,
  formatRelativeTime,
} from "@/lib/format";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

export function InboxList() {
  const enquiries = useEnquiryStore((s) => s.enquiries);
  const selectedId = useEnquiryStore((s) => s.selectedId);
  const analyses = useEnquiryStore((s) => s.analyses);
  const statuses = useEnquiryStore((s) => s.statuses);
  const select = useEnquiryStore((s) => s.selectEnquiry);

  return (
    <div>
      <div className="px-4 pt-5 pb-3 sticky top-0 bg-background z-10 border-b border-border/40">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Inbox · {enquiries.length}
        </p>
      </div>
      <ul>
        {enquiries.map((enq) => {
          const analysis = analyses[enq.id];
          const status = statuses[enq.id];
          const isSelected = enq.id === selectedId;
          return (
            <li key={enq.id} className="border-b border-border/40 last:border-0">
              <button
                type="button"
                onClick={() => select(enq.id)}
                className={`group w-full text-left px-4 py-3 transition-colors relative ${
                  isSelected
                    ? "bg-accent/60"
                    : "hover:bg-accent/30"
                }`}
              >
                {isSelected && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-foreground rounded-r" aria-hidden />
                )}
                <div className="flex items-start gap-2.5">
                  <div className="mt-1.5 shrink-0">
                    {analysis ? (
                      <span
                        className={`block h-2 w-2 rounded-full ring-2 ring-background ${classificationDotColor(analysis.classification)}`}
                        aria-hidden
                      />
                    ) : status === "analyzing" ? (
                      <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                    ) : status === "error" ? (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-muted-foreground/30" aria-hidden />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[13px] font-medium truncate text-foreground">{enq.from_name}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                        {formatRelativeTime(enq.received_at)}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground truncate mt-0.5 leading-snug">{enq.subject}</p>
                    {analysis && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-medium">
                          {classificationLabel(analysis.classification)}
                        </span>
                        {analysis.flags.includes("high_value_lead") && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-[0.06em] text-amber-600 dark:text-amber-400 font-semibold">
                            <Sparkles className="h-2.5 w-2.5" />
                            HVL
                          </span>
                        )}
                        {analysis.urgency === "urgent" && (
                          <span className="text-[10px] uppercase tracking-[0.06em] text-red-600 dark:text-red-400 font-semibold">
                            ● URGENT
                          </span>
                        )}
                        {analysis.flags.includes("confidentiality_required") && (
                          <span className="text-[10px] uppercase tracking-[0.06em] text-violet-600 dark:text-violet-400 font-semibold">
                            ◆ CONF
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
    </div>
  );
}
