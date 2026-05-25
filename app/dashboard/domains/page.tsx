"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

interface Domain { name: string; verified: boolean; verification?: { type: string; domain: string; value: string; reason: string }[]; redirect?: string; createdAt?: number; }

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/vercel/domains");
    const data = await res.json();
    setDomains(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAdding(true); setError("");
    const res = await fetch("/api/vercel/domains", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: newDomain.trim() }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); } else { setNewDomain(""); load(); }
    setAdding(false);
  }

  async function handleRemove(name: string) {
    if (!confirm(`Remove ${name}?`)) return;
    await fetch("/api/vercel/domains", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: name }),
    });
    load();
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Domains</h1>
        <button onClick={load} className="w-7 h-7 flex items-center justify-center border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors duration-150">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {/* Add domain */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input value={newDomain} onChange={e => setNewDomain(e.target.value)}
            placeholder="yourdomain.com" disabled={adding}
            className="flex-1 h-9 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50 font-mono" />
          <button type="submit" disabled={adding || !newDomain.trim()}
            className="flex items-center gap-1.5 px-4 h-9 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
        {error && <p className="text-xs text-destructive mb-4">{error}</p>}

        {/* Domain list */}
        {loading ? (
          <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-foreground/5 animate-pulse" />)}</div>
        ) : domains.length === 0 ? (
          <div className="border border-foreground/10 p-8 text-center">
            <p className="text-sm text-muted-foreground">No custom domains yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add a domain above to get started</p>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {domains.map((d, i) => (
              <div key={d.name} className={`flex items-start gap-4 px-4 py-4 ${i < domains.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono font-medium">{d.name}</span>
                    {d.verified
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      : <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    }
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 ${d.verified ? "text-green-600 bg-green-500/10" : "text-yellow-600 bg-yellow-500/10"}`}>
                      {d.verified ? "Valid" : "Pending"}
                    </span>
                  </div>
                  {!d.verified && d.verification && d.verification[0] && (
                    <div className="bg-foreground/[0.03] border border-foreground/10 p-3 mt-2">
                      <p className="text-[10px] font-mono text-muted-foreground mb-1">Add this DNS record:</p>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <span className="text-muted-foreground">Type: <span className="text-foreground">{d.verification[0].type}</span></span>
                        <span className="text-muted-foreground">Name: <span className="text-foreground">{d.verification[0].domain}</span></span>
                        <span className="text-muted-foreground truncate">Value: <span className="text-foreground">{d.verification[0].value}</span></span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {d.verified && (
                    <a href={`https://${d.name}`} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => handleRemove(d.name)}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors duration-150">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
