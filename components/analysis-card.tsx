import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
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
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-violet-500" />
          AI Analysis
          {selfCorrected && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">[self-corrected]</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "analyzing" && <AnalysisSkeleton />}
        {status === "done" && analysis && <AnalysisFields analysis={analysis} />}
        {status === "idle" && <p className="text-sm text-muted-foreground">No analysis yet.</p>}
      </CardContent>
    </Card>
  );
}

function AnalysisFields({ analysis }: { analysis: Analysis }) {
  const conf = confidenceTone(analysis.classification_confidence);
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Classification">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${classificationDotColor(analysis.classification)}`} />
            <span className="text-sm font-medium">{classificationLabel(analysis.classification)}</span>
          </div>
        </Field>
        <Field label="Confidence">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${conf.className}`}
          >
            {(analysis.classification_confidence * 100).toFixed(0)}% · {conf.label}
          </span>
        </Field>
        <Field label="Urgency">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${urgencyBadgeClass(analysis.urgency)}`}
          >
            {urgencyLabel(analysis.urgency)}
          </span>
        </Field>
        <Field label="Geography">
          <span className="text-sm font-medium">{geographyLabel(analysis.geography)}</span>
        </Field>
      </div>
      <Field label="Reasoning">
        <p className="text-sm text-foreground/90">{analysis.classification_reasoning}</p>
      </Field>
      <Field label="Flags">
        <FlagChips flags={analysis.flags} />
      </Field>
      <Field label="Recommended action">
        <p className="text-sm text-foreground/90">{analysis.recommended_action}</p>
      </Field>
    </>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        {["Classification", "Confidence", "Urgency", "Geography"].map((label) => (
          <div key={label}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              {label}
            </p>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Reasoning
        </p>
        <Skeleton className="h-4 w-full" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Flags</p>
        <Skeleton className="h-5 w-32" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Recommended action
        </p>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-1" />
      </div>
      <p className="text-xs text-muted-foreground italic">Analysing with Gemini (~5s)…</p>
    </div>
  );
}
