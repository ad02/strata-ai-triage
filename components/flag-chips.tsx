import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { flagDescription, flagLabel, flagToneClass } from "@/lib/format";
import type { Flag } from "@/lib/schema";

export function FlagChips({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) {
    return <span className="text-xs text-muted-foreground italic">No flags</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <Tooltip key={flag}>
          <TooltipTrigger
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium cursor-help ${flagToneClass(flag)}`}
          >
            {flagLabel(flag)}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{flagDescription(flag)}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
