"use client";

import { useEffect, useState } from "react";

type HealthState = "checking" | "connected" | "unreachable";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const labels: Record<HealthState, string> = {
  checking: "Checking backend…",
  connected: "Backend connected",
  unreachable: "Backend unreachable",
};

const indicatorClasses: Record<HealthState, string> = {
  checking: "bg-amber-400",
  connected: "bg-emerald-500",
  unreachable: "bg-rose-500",
};

export function HealthStatus() {
  const [state, setState] = useState<HealthState>("checking");

  useEffect(() => {
    let active = true;

    async function checkHealth() {
      try {
        const response = await fetch(`${API_URL}/health`, { cache: "no-store" });
        const payload = (await response.json()) as {
          status?: string;
          db?: string;
        };
        if (active) {
          setState(
            response.ok && payload.status === "ok" && payload.db === "ok"
              ? "connected"
              : "unreachable",
          );
        }
      } catch {
        if (active) {
          setState("unreachable");
        }
      }
    }

    void checkHealth();
    const interval = window.setInterval(checkHealth, 5_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${indicatorClasses[state]}`}
        aria-hidden="true"
      />
      {labels[state]}
    </div>
  );
}
