import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2 } from "lucide-react";
import { FlagChips } from "@/components/flag-chips";
import {
  classificationDotColor,
  classificationLabel,
  confidenceTone,
  geographyLabel,
  urgencyBadgeClass,
  urgencyLabel,
} from "@/lib/format";
import type { Analysis } from "@/lib/schema";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

export function AnalysisCard({
  analysis,
  status,
  selfCorrected,
}: {
  analysis?: Analysis;
  status: "idle" | "analyzing" | "done" | "error";
  selfCorrected?: boolean;
}) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          AI Analysis
          {selfCorrected && (
            <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
              self-corrected
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {status === "analyzing" && <AnalysisSkeleton />}
        {status === "done" && analysis && <AnalysisFields analysis={analysis} />}
        {status === "idle" && (
          <p className="text-sm text-muted-foreground italic">No analysis yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisFields({ analysis }: { analysis: Analysis }) {
  const conf = confidenceTone(analysis.classification_confidence);
  return (
    <>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Classification">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${classificationDotColor(analysis.classification)}`} />
            <span className="text-sm font-medium">{classificationLabel(analysis.classification)}</span>
          </div>
        </Field>
        <Field label="Confidence">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${conf.className}`}
            >
              {conf.label}
            </span>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              {(analysis.classification_confidence * 100).toFixed(0)}%
            </span>
          </div>
        </Field>
        <Field label="Urgency">
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${urgencyBadgeClass(analysis.urgency)}`}
          >
            {urgencyLabel(analysis.urgency)}
          </span>
        </Field>
        <Field label="Geography">
          <span className="text-sm font-medium tabular-nums">{geographyLabel(analysis.geography)}</span>
        </Field>
      </div>

      <div className="border-t border-border/60 pt-4 space-y-4">
        <Field label="Reasoning">
          <p className="text-sm leading-relaxed text-foreground/85">{analysis.classification_reasoning}</p>
        </Field>
        <Field label="Flags">
          <FlagChips flags={analysis.flags} />
        </Field>
        <Field label="Recommended action">
          <p className="text-sm leading-relaxed text-foreground/85">{analysis.recommended_action}</p>
        </Field>
      </div>
    </>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {["Classification", "Confidence", "Urgency", "Geography"].map((label) => (
          <div key={label}>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
              {label}
            </p>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 pt-4 space-y-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
            Reasoning
          </p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-1.5" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
            Flags
          </p>
          <Skeleton className="h-5 w-32" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
            Recommended action
          </p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1.5" />
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground italic pt-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analysing with Gemini (~5s)…
        </p>
      </div>
    </div>
  );
}
