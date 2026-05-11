"use client";

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type HealthState =
  | { state: "checking" }
  | { state: "ok"; latency_ms: number }
  | { state: "degraded"; error: string };

export function HealthIndicator() {
  const [health, setHealth] = useState<HealthState>({ state: "checking" });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (json.status === "ok") {
          setHealth({ state: "ok", latency_ms: json.latency_ms });
        } else {
          setHealth({ state: "degraded", error: json.error ?? "unknown" });
        }
      } catch (err) {
        if (cancelled) return;
        setHealth({ state: "degraded", error: err instanceof Error ? err.message : "network" });
      }
    }
    check();
    const interval = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const dot =
    health.state === "ok"
      ? "bg-emerald-500"
      : health.state === "degraded"
        ? "bg-red-500"
        : "bg-muted-foreground/40 animate-pulse";

  const ring =
    health.state === "ok"
      ? "ring-emerald-500/20"
      : health.state === "degraded"
        ? "ring-red-500/20"
        : "ring-muted-foreground/10";

  const label =
    health.state === "ok"
      ? `Gemini · ${health.latency_ms}ms`
      : health.state === "degraded"
        ? `Gemini degraded — ${truncate(health.error, 80)}`
        : "Checking Gemini…";

  const stateText =
    health.state === "ok"
      ? "Gemini live"
      : health.state === "degraded"
        ? "Gemini degraded"
        : "Checking…";

  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-help">
        <span className={`relative flex h-2 w-2`}>
          <span className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-60 animate-ping`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ring-2 ${ring} ${dot}`} />
        </span>
        <span className="hidden sm:inline tabular-nums">{stateText}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
