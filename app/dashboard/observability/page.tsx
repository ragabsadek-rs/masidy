"use client";

import { useEffect, useState } from "react";
import { Eye, RefreshCw, ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/vercel";

export const dynamic = "force-dynamic";

interface Deployment { uid: string; url: string; state: string; created: number; }

export default function ObservabilityPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/deployments")
      .then(r => r.json())
      .then(d => { setDeployments(Array.isArray(d) ? d.slice(0, 5) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Observability</h1>
        <a href="https://vercel.com/observability" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
          <ExternalLink className="w-3 h-3" />Open in Vercel
        </a>
      </div>
      <div className="flex-1 px-6 py-6 max-w-4xl">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Edge Requests (24h)", value: "—" },
            { label: "Function Invocations (24h)", value: "—" },
            { label: "Error Rate", value: "0%" },
          ].map(stat => (
            <div key={stat.label} className="border border-foreground/10 p-4">
              <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-3xl font-display">{stat.value}</p>
            </div>
          ))}
        </div>

        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Recent Deployments</p>
        {loading ? (
          <div className="flex flex-col gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-foreground/5 animate-pulse" />)}</div>
        ) : (
          <div className="border border-foreground/10">
            {deployments.map((d, i) => (
              <div key={d.uid} className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < deployments.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${d.state === "READY" ? "bg-green-500" : d.state === "ERROR" ? "bg-red-500" : "bg-yellow-500"}`} />
                <span className="text-sm font-mono flex-1 truncate text-blue-500">{d.url}</span>
                <span className="text-xs font-mono text-muted-foreground capitalize">{d.state?.toLowerCase()}</span>
                <span className="text-xs font-mono text-muted-foreground">{timeAgo(d.created)}</span>
                <a href={`/dashboard/logs?deploymentId=${d.uid}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">Logs →</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
