"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEnquiryStore } from "@/lib/store";
import { useAnalyze } from "@/lib/use-analyze";
import { AnalysisBanners } from "@/components/banners";
import { AnalysisCard } from "@/components/analysis-card";
import { RoutingCard } from "@/components/routing-card";
import { SuggestedReplyCard } from "@/components/suggested-reply-card";
import { formatRelativeTime } from "@/lib/format";

class AnalysisErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <Card className="shadow-sm border-red-200 dark:border-red-900/60">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Analysis card crashed.</p>
              <p className="text-[12px] text-muted-foreground mt-1">{this.state.error.message}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 text-xs"
                onClick={() => {
                  this.setState({ error: null });
                  this.props.onReset();
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export function EnquiryDetail() {
  const enquiry = useEnquiryStore((s) => s.selectedEnquiry());
  const analysis = useEnquiryStore((s) => s.selectedAnalysis());
  const status = useEnquiryStore((s) => s.selectedStatus());
  const error = useEnquiryStore((s) => s.selectedError());
  const analyze = useAnalyze();

  if (!enquiry) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mx-auto">
            <Inbox className="h-6 w-6 opacity-40" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Select an enquiry</p>
          <p className="mt-1 text-xs">Choose one from the inbox to see its analysis.</p>
        </div>
      </div>
    );
  }

  const handleRetry = () => analyze(enquiry.id, enquiry.body);

  return (
    <div className="max-w-3xl mx-auto px-8 py-8 space-y-4">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight leading-tight">{enquiry.subject}</h2>
        <p className="text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground/80">{enquiry.from_name}</span>
          <span className="mx-1.5 opacity-40">·</span>
          <span className="text-muted-foreground/80">{enquiry.from_email}</span>
          <span className="mx-1.5 opacity-40">·</span>
          <span className="tabular-nums">{formatRelativeTime(enquiry.received_at)}</span>
        </p>
      </header>

      <Card className="shadow-sm border-border/60 bg-card">
        <CardContent className="pt-5 pb-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2.5">
            Original message
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">{enquiry.body}</p>
        </CardContent>
      </Card>

      {status === "error" && (
        <Card className="shadow-sm border-red-200 dark:border-red-900/60">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Analysis failed</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{error}</p>
              <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "done" && analysis && <AnalysisBanners analysis={analysis} />}

      <AnalysisErrorBoundary onReset={handleRetry} key={enquiry.id}>
        <AnalysisCard analysis={analysis} status={status === "error" ? "idle" : status} />
      </AnalysisErrorBoundary>

      {status === "done" && analysis && (
        <>
          <RoutingCard route={analysis.route_to} />
          <SuggestedReplyCard reply={analysis.suggested_reply} key={enquiry.id} />
        </>
      )}
    </div>
  );
}
