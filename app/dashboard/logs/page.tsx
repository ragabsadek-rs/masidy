"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCw, Download, Filter, X } from "lucide-react";

export const dynamic = "force-dynamic";

interface LogEntry { type: string; created: number; text?: string; payload?: { text?: string; level?: string }; }

export default function LogsPage() {
  const [deployments, setDeployments] = useState<{ uid: string; url: string; state: string }[]>([]);
  const [selectedDeploy, setSelectedDeploy] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/vercel/deployments")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDeployments(data.slice(0, 10));
          setSelectedDeploy(data[0].uid);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedDeploy) return;
    setLoading(true);
    fetch(`/api/vercel/logs?deploymentId=${selectedDeploy}`)
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedDeploy]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const filtered = logs.filter(l => {
    const text = l.text ?? l.payload?.text ?? "";
    return !filter || text.toLowerCase().includes(filter.toLowerCase());
  });

  function levelColor(level?: string) {
    if (!level) return "text-foreground/70";
    if (level === "error") return "text-red-500";
    if (level === "warning") return "text-yellow-500";
    if (level === "info") return "text-blue-400";
    return "text-foreground/70";
  }

  function downloadLogs() {
    const text = filtered.map(l => `[${new Date(l.created).toISOString()}] ${l.text ?? l.payload?.text ?? ""}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `masidy-logs-${selectedDeploy}.txt`; a.click();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-foreground/10 shrink-0">
        <select value={selectedDeploy} onChange={e => setSelectedDeploy(e.target.value)}
          className="text-xs font-mono border border-foreground/10 bg-background px-2 h-7 outline-none flex-1 max-w-xs">
          {deployments.map(d => (
            <option key={d.uid} value={d.uid}>{d.url} ({d.state})</option>
          ))}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter logs…"
            className="w-full h-7 pl-7 pr-6 text-xs font-mono border border-foreground/10 bg-background outline-none" />
          {filter && <button onClick={() => setFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>}
        </div>
        <button onClick={downloadLogs} className="w-7 h-7 flex items-center justify-center border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors duration-150">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setSelectedDeploy(s => s)} className="w-7 h-7 flex items-center justify-center border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors duration-150">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-auto bg-foreground/[0.015] font-mono text-xs p-4">
        {loading ? (
          <div className="flex flex-col gap-1.5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-3.5 w-24 shrink-0 animate-pulse bg-foreground/10" />
                <div className="h-3.5 animate-pulse bg-foreground/10" style={{ width: `${40 + (i * 37) % 50}%` }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No logs found{filter ? ` matching "${filter}"` : ""}</p>
        ) : (
          filtered.map((log, i) => {
            const text = log.text ?? log.payload?.text ?? "";
            const level = log.payload?.level;
            const time = new Date(log.created).toISOString().split("T")[1].slice(0, 12);
            return (
              <div key={i} className="flex gap-3 leading-5 hover:bg-foreground/5 px-1 -mx-1">
                <span className="text-muted-foreground/50 shrink-0 select-none">{time}</span>
                <span className={levelColor(level)}>{text}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
