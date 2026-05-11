import { ArrowRight, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamMember } from "@/lib/team";
import { routeLabel } from "@/lib/format";
import type { RouteTo } from "@/lib/schema";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-foreground/80 text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

export function RoutingCard({ route }: { route: RouteTo }) {
  const member = getTeamMember(route);
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
          Suggested route
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <Initials name={member.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium leading-tight">{member.name}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{member.title}</p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground rounded-md border border-border/60 px-1.5 py-0.5">
                {routeLabel(route)}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed italic">
              {member.note}
            </p>
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2 group"
            >
              <Mail className="h-3 w-3" />
              <span className="group-hover:underline">{member.email}</span>
            </a>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground border-t border-border/60 pt-3 leading-relaxed">
          Auto-routing is a recommendation, not an action — review before forwarding.
        </p>
      </CardContent>
    </Card>
  );
}
