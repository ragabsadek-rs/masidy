"use client";

import { useEffect, useState } from "react";
import { Zap, BarChart2, Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const dynamic = "force-dynamic";

interface GatewayKey { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null; }
interface UsageSummary { provider: string; model: string; total_requests: number; total_credits: number; }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AIGatewayPage() {
  const { toast } = useToast();
  const [credits, setCredits] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<{ action: string; amount: number; description: string; created_at: string }[]>([]);
  const [keys, setKeys] = useState<GatewayKey[]>([]);
  const [usage, setUsage] = useState<UsageSummary[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function fetchKeys() {
    setKeysLoading(true);
    fetch("/api/gateway/keys").then(r => r.json()).then(d => { setKeys(Array.isArray(d) ? d : []); setKeysLoading(false); }).catch(() => setKeysLoading(false));
  }

  useEffect(() => {
    fetch("/api/credits/balance").then(r => r.json()).then(d => setCredits(d.balance)).catch(() => {});
    fetch("/api/credits/transactions").then(r => r.json()).then(d => setTransactions(Array.isArray(d) ? d.slice(0, 20) : [])).catch(() => {});
    fetch("/api/gateway/usage").then(r => r.json()).then(d => setUsage(Array.isArray(d) ? d : [])).catch(() => {});
    fetchKeys();
  }, []);

  const totalUsed = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalPurchased = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/gateway/keys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewKeyValue(data.key);
      setNewKeyName("");
      fetchKeys();
    } else {
      toast({ title: data.error ?? "Failed to create key", variant: "destructive" });
    }
    setCreating(false);
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/gateway/keys/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Key revoked" }); fetchKeys(); }
    else toast({ title: "Failed to revoke key", variant: "destructive" });
  }

  function copyKey() {
    if (!newKeyValue) return;
    navigator.clipboard.writeText(newKeyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Toaster />
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">AI Gateway</h1>
        <Link href="/dashboard/billing" className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
          <Zap className="w-3 h-3" />Buy Credits
        </Link>
      </div>

      <div className="flex-1 px-6 py-6 max-w-4xl space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{ label: "Current Balance", value: credits ?? "—", unit: "credits" }, { label: "Total Used", value: totalUsed.toFixed(1), unit: "credits" }, { label: "Total Purchased", value: totalPurchased, unit: "credits" }].map(s => (
            <div key={s.label} className="border border-foreground/10 p-4">
              <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
              <p className="text-3xl font-display">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.unit}</p>
            </div>
          ))}
        </div>

        {/* New key revealed */}
        {newKeyValue && (
          <div className="border border-green-500/20 bg-green-500/5 p-5">
            <p className="text-sm font-medium mb-1 text-green-700">API Key Created</p>
            <p className="text-xs text-muted-foreground mb-3">Copy this key now — it will not be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-background border border-foreground/10 px-3 py-2 truncate">{newKeyValue}</code>
              <button onClick={copyKey} className="p-2 border border-foreground/10 hover:bg-foreground/5 transition-colors duration-150">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button onClick={() => setNewKeyValue(null)} className="p-2 border border-foreground/10 hover:bg-foreground/5 transition-colors duration-150 text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </div>
        )}

        {/* API Keys */}
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">API Keys</p>
          <form onSubmit={handleCreateKey} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. My App)"
                className="w-full h-9 pl-9 pr-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150" />
            </div>
            <button type="submit" disabled={creating || !newKeyName.trim()}
              className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" />{creating ? "Creating…" : "Create Key"}
            </button>
          </form>

          {keysLoading ? (
            <div className="flex flex-col gap-2">{[...Array(2)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-foreground/10" />)}</div>
          ) : keys.length === 0 ? (
            <div className="border border-foreground/10 px-4 py-8 text-center">
              <Key className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No API keys yet</p>
            </div>
          ) : (
            <div className="border border-foreground/10">
              {keys.map((k, i) => (
                <div key={k.id} className={`flex items-center gap-4 px-4 py-3 ${i < keys.length - 1 ? "border-b border-foreground/10" : ""}`}>
                  <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">msk_{k.key_prefix}… · created {timeAgo(k.created_at)}{k.last_used_at ? ` · last used ${timeAgo(k.last_used_at)}` : ""}</p>
                  </div>
                  {k.revoked_at ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-500">revoked</span>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-background border border-foreground/10 rounded-none max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm text-muted-foreground">This will immediately invalidate the key. Any apps using it will stop working.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="h-9 px-5 rounded-full border-foreground/10 text-sm">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(k.id)} className="h-9 px-5 rounded-full bg-foreground text-background text-sm">Revoke</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gateway usage summary */}
        {usage.length > 0 && (
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Usage by Model</p>
            <div className="border border-foreground/10">
              <div className="grid grid-cols-[1fr_100px_100px_100px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
                {["Provider / Model", "Requests", "Credits", ""].map(h => <span key={h} className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{h}</span>)}
              </div>
              {usage.map((u, i) => (
                <div key={`${u.provider}-${u.model}`} className={`grid grid-cols-[1fr_100px_100px_100px] items-center px-4 py-2.5 ${i < usage.length - 1 ? "border-b border-foreground/10" : ""}`}>
                  <span className="text-sm font-mono">{u.provider}/{u.model}</span>
                  <span className="text-sm font-mono">{u.total_requests.toLocaleString()}</span>
                  <span className="text-sm font-mono">{u.total_credits.toFixed(2)}</span>
                  <span />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage history */}
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Usage History</p>
          {transactions.length === 0 ? (
            <div className="border border-foreground/10 px-4 py-8 text-center">
              <BarChart2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No usage yet</p>
            </div>
          ) : (
            <div className="border border-foreground/10">
              <div className="grid grid-cols-[1fr_80px_200px_100px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
                {["Description", "Credits", "Action", "Date"].map(h => <span key={h} className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{h}</span>)}
              </div>
              {transactions.map((t, i) => (
                <div key={i} className={`grid grid-cols-[1fr_80px_200px_100px] items-center px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < transactions.length - 1 ? "border-b border-foreground/10" : ""}`}>
                  <span className="text-sm truncate">{t.description}</span>
                  <span className={`text-sm font-mono ${t.amount < 0 ? "text-red-500" : "text-green-600"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
                  <span className="text-xs font-mono text-muted-foreground">{t.action}</span>
                  <span className="text-xs font-mono text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
