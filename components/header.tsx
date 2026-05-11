import { HealthIndicator } from "@/components/health-indicator";
import { NewEnquiryDialog } from "@/components/new-enquiry-dialog";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3 bg-background">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Strata AI Triage</h1>
        <p className="text-xs text-muted-foreground">Strata Business Brokers · enquiry classification & response prototype</p>
      </div>
      <div className="flex items-center gap-4">
        <HealthIndicator />
        <NewEnquiryDialog />
      </div>
    </header>
  );
}
