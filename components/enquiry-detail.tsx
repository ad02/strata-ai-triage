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
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Analysis card crashed.</p>
              <p className="text-sm text-muted-foreground mt-1">{this.state.error.message}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
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
          <Inbox className="h-10 w-10 mx-auto opacity-30" />
          <p className="mt-2 text-sm">Select an enquiry from the inbox.</p>
        </div>
      </div>
    );
  }

  const handleRetry = () => analyze(enquiry.id, enquiry.body);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <header>
        <p className="text-xs text-muted-foreground">
          From: <span className="font-medium text-foreground">{enquiry.from_name}</span>{" "}
          &lt;{enquiry.from_email}&gt; · {formatRelativeTime(enquiry.received_at)}
        </p>
        <h2 className="text-lg font-semibold mt-1">{enquiry.subject}</h2>
      </header>

      <Card>
        <CardContent className="pt-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Original message</p>
          <p className="text-sm whitespace-pre-wrap text-foreground/90">{enquiry.body}</p>
        </CardContent>
      </Card>

      {status === "error" && (
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Analysis failed.</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={handleRetry}>
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
