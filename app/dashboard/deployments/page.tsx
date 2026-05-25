"use client";

import { useEffect, useState } from "react";
import { GitBranch, ExternalLink, RotateCcw, RefreshCw, ChevronDown, Filter } from "lucide-react";
import { deploymentStatusColor, timeAgo } from "@/lib/vercel";

export const dynamic = "force-dynamic";

interface Deployment {
  uid: string; name: string; url: string; state: string;
  created: number; meta?: { githubCommitRef?: string; githubCommitMessage?: string; githubCommitAuthorName?: string };
  target?: string;
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/vercel/deployments");
    const data = await res.json();
    setDeployments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = deployments.filter(d => filter === "all" || d.state === filter.toUpperCase());

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Deployments</h1>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-xs border border-foreground/10 bg-background px-2 h-7 outline-none font-mono">
            <option value="all">All</option>
            <option value="ready">Ready</option>
            <option value="error">Error</option>
            <option value="building">Building</option>
          </select>
          <button onClick={load} className="w-7 h-7 flex items-center justify-center border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors duration-150">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-foreground/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm text-muted-foreground">No deployments found</p>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {filtered.map((d, i) => (
              <div key={d.uid}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < filtered.length - 1 ? "border-b border-foreground/10" : ""}`}>
                {/* Status */}
                <div className="flex items-center gap-2 w-24 shrink-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${deploymentStatusColor(d.state)}`} />
                  <span className="text-xs font-mono capitalize">{d.state?.toLowerCase()}</span>
                </div>

                {/* URL */}
                <div className="flex-1 min-w-0">
                  <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-mono text-blue-500 hover:underline truncate block">
                    {d.url}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <GitBranch className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {d.meta?.githubCommitRef ?? "main"} — {d.meta?.githubCommitMessage ?? ""}
                    </span>
                  </div>
                </div>

                {/* Target */}
                <span className={`text-[10px] font-mono px-1.5 py-0.5 shrink-0 ${
                  d.target === "production" ? "bg-foreground text-background" : "border border-foreground/15 text-muted-foreground"
                }`}>
                  {d.target ?? "preview"}
                </span>

                {/* Author */}
                <span className="text-xs text-muted-foreground shrink-0 w-24 truncate">
                  {d.meta?.githubCommitAuthorName ?? "—"}
                </span>

                {/* Time */}
                <span className="text-xs font-mono text-muted-foreground shrink-0 w-20 text-right">
                  {timeAgo(d.created)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer"
                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
