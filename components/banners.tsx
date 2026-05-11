import { AlertTriangle, Sparkles } from "lucide-react";
import type { Analysis } from "@/lib/schema";

export function AnalysisBanners({ analysis }: { analysis: Analysis }) {
  const banners: React.ReactNode[] = [];

  if (analysis.classification_confidence < 0.7) {
    banners.push(
      <div
        key="low-conf"
        className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
      >
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Low confidence — recommend human review</p>
          <p className="text-xs opacity-80">
            Confidence {(analysis.classification_confidence * 100).toFixed(0)}% is below the 70% threshold.
            The AI has flagged this for clarification.
          </p>
        </div>
      </div>,
    );
  }

  if (analysis.flags.includes("high_value_lead")) {
    banners.push(
      <div
        key="hvl"
        className="flex items-start gap-2 rounded-md border border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:from-amber-950/50 dark:to-yellow-950/30 dark:text-amber-200"
      >
        <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-medium">High-value lead — escalate to principal</p>
          <p className="text-xs opacity-80">
            Signals detected: large portfolio, PE buyer, or other indicator of significant deal value.
          </p>
        </div>
      </div>,
    );
  }

  if (analysis.flags.includes("confidentiality_required")) {
    banners.push(
      <div
        key="conf"
        className="flex items-start gap-2 rounded-md border border-violet-300 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
      >
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Confidentiality required</p>
          <p className="text-xs opacity-80">
            Sender requested discretion. Limit communications to a private channel; do not discuss with
            staff or client-facing teams.
          </p>
        </div>
      </div>,
    );
  }

  if (banners.length === 0) return null;
  return <div className="space-y-2">{banners}</div>;
}
