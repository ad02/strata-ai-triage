import { Building2 } from "lucide-react";
import { HealthIndicator } from "@/components/health-indicator";
import { NewEnquiryDialog } from "@/components/new-enquiry-dialog";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 h-14 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-foreground text-background">
          <Building2 className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight leading-none">Strata AI Triage</h1>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Strata Business Brokers · enquiry classification & response
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <HealthIndicator />
        <NewEnquiryDialog />
      </div>
    </header>
  );
}
