import { ArrowRight, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamMember } from "@/lib/team";
import { routeLabel } from "@/lib/format";
import type { RouteTo } from "@/lib/schema";

export function RoutingCard({ route }: { route: RouteTo }) {
  const member = getTeamMember(route);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRight className="h-4 w-4 text-blue-500" />
          Suggested route
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {member.name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">— {routeLabel(route)}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{member.title}</p>
            <p className="text-xs text-muted-foreground mt-2 italic">{member.note}</p>
          </div>
          <a
            href={`mailto:${member.email}`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{member.email}</span>
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
          Review before forwarding — auto-routing is a recommendation, not an action.
        </p>
      </CardContent>
    </Card>
  );
}
