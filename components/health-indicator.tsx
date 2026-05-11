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
        : "bg-slate-400 animate-pulse";

  const label =
    health.state === "ok"
      ? `Gemini OK · ${health.latency_ms} ms`
      : health.state === "degraded"
        ? `Gemini degraded · ${health.error}`
        : "Checking Gemini…";

  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center gap-2 text-xs text-muted-foreground cursor-help">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <span className="hidden sm:inline">
          {health.state === "ok" ? "Gemini" : health.state === "degraded" ? "Gemini ⚠" : "…"}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
