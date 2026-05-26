"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

interface EnvVar { id: string; key: string; target: string[]; type: string; updatedAt: number; }

const TARGETS = ["production", "preview", "development"];

export default function EnvPage() {
  const [envs, setEnvs] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newTarget, setNewTarget] = useState(["production", "preview", "development"]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/vercel/env");
    const data = await res.json();
    setEnvs(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    setSaving(true);
    const res = await fetch("/api/vercel/env", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: newKey.trim(), value: newValue.trim(), target: newTarget }),
    });
    if (res.ok) {
      toast({ title: "Variable saved", description: `${newKey.trim()} has been added.` });
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Failed to save variable", description: data?.error ?? "An error occurred.", variant: "destructive" });
    }
    setNewKey(""); setNewValue(""); setShowAdd(false); setSaving(false);
    load();
  }

  async function handleDelete(id: string, key: string) {
    if (!confirm("Delete this variable?")) return;
    const res = await fetch("/api/vercel/env", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast({ title: "Variable deleted", description: `${key} has been removed.` });
    } else {
      toast({ title: "Failed to delete variable", variant: "destructive" });
    }
    load();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Toaster />
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Environment Variables</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
            <Plus className="w-3 h-3" /> Add Variable
          </button>
          <button onClick={load} className="w-7 h-7 flex items-center justify-center border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors duration-150">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-4xl">
        {showAdd && (
          <form onSubmit={handleAdd} className="border border-foreground/10 p-4 mb-6 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Key</label>
                <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="MY_SECRET_KEY"
                  className="w-full h-8 px-2 text-xs font-mono border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Value</label>
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="value" type="password"
                  className="w-full h-8 px-2 text-xs font-mono border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Environments</label>
              <div className="flex gap-3 flex-wrap">
                {TARGETS.map(t => (
                  <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={newTarget.includes(t)}
                      onChange={e => setNewTarget(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))}
                      className="w-3 h-3" />
                    <span className="capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !newKey || !newValue}
                className="px-4 h-8 bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 h-8 border border-foreground/15 text-xs hover:bg-foreground/5 transition-colors duration-150">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {loading ? (
              <div className="border border-foreground/10 flex flex-col">
                <div className="grid grid-cols-[1fr_120px_80px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
                  <div className="h-2.5 w-8 animate-pulse bg-foreground/10" />
                  <div className="h-2.5 w-20 animate-pulse bg-foreground/10" />
                  <div className="h-2.5 w-8 animate-pulse bg-foreground/10" />
                </div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`grid grid-cols-[1fr_120px_80px_auto] items-center px-4 py-2.5 ${i < 5 ? "border-b border-foreground/10" : ""}`}>
                    <div className="h-3.5 w-40 animate-pulse bg-foreground/10" />
                    <div className="flex gap-1">
                      <div className="h-4 w-8 animate-pulse bg-foreground/10" />
                      <div className="h-4 w-8 animate-pulse bg-foreground/10" />
                    </div>
                    <div className="h-3 w-12 animate-pulse bg-foreground/10" />
                    <div className="h-6 w-6 animate-pulse bg-foreground/10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-foreground/10">
                <div className="grid grid-cols-[1fr_120px_80px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Key</span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Environments</span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Type</span>
                </div>
                {envs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">No environment variables</div>
                ) : envs.map((env, i) => (
                  <div key={env.id} className={`grid grid-cols-[1fr_120px_80px_auto] items-center px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < envs.length - 1 ? "border-b border-foreground/10" : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-mono truncate">{env.key}</span>
                      <button onClick={() => copyKey(env.key)} className="text-muted-foreground hover:text-foreground transition-colors duration-150 shrink-0">
                        {copied === env.key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {env.target?.map(t => (
                        <span key={t} className="text-[9px] font-mono border border-foreground/10 px-1 py-0.5 capitalize">{t.slice(0, 4)}</span>
                      ))}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{env.type}</span>
                    <button onClick={() => handleDelete(env.id, env.key)}
                      className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors duration-150">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
