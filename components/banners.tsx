import { AlertTriangle, Lock, Sparkles } from "lucide-react";
import type { Analysis } from "@/lib/schema";

function Banner({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "amber" | "violet" | "gold";
}) {
  const toneClass =
    tone === "gold"
      ? "border-amber-300/60 bg-gradient-to-r from-amber-50/80 to-yellow-50/40 text-amber-950 dark:border-amber-800/40 dark:from-amber-950/40 dark:to-yellow-950/20 dark:text-amber-100"
      : tone === "violet"
        ? "border-violet-300/60 bg-violet-50/60 text-violet-950 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-100"
        : "border-amber-300/60 bg-amber-50/60 text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-100";
  return (
    <div className={`flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm shadow-sm ${toneClass}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="font-medium leading-tight">{title}</p>
        <p className="text-[12px] opacity-80 mt-1 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export function AnalysisBanners({ analysis }: { analysis: Analysis }) {
  const banners: React.ReactNode[] = [];

  if (analysis.classification_confidence < 0.7) {
    banners.push(
      <Banner
        key="low-conf"
        tone="amber"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        title="Low confidence — recommend human review"
        body={`Confidence ${(analysis.classification_confidence * 100).toFixed(0)}% is below the 70% threshold. The AI has flagged this for clarification.`}
      />,
    );
  }

  if (analysis.flags.includes("high_value_lead")) {
    banners.push(
      <Banner
        key="hvl"
        tone="gold"
        icon={<Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
        title="High-value lead — escalate to principal"
        body="Signals detected: large portfolio, PE buyer, or other indicator of significant deal value."
      />,
    );
  }

  if (analysis.flags.includes("confidentiality_required")) {
    banners.push(
      <Banner
        key="conf"
        tone="violet"
        icon={<Lock className="h-3.5 w-3.5" />}
        title="Confidentiality required"
        body="Sender requested discretion. Limit communications to a private channel; do not discuss with staff or client-facing teams."
      />,
    );
  }

  if (banners.length === 0) return null;
  return <div className="space-y-2">{banners}</div>;
}
