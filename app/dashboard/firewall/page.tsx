"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

interface FirewallRule {
  id: string;
  name?: string;
  action: string;
  ip?: string;
  hostname?: string;
  path?: string;
  description?: string;
}

export default function FirewallPage() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formIp, setFormIp] = useState("");
  const [formAction, setFormAction] = useState<"deny" | "allow">("deny");
  const [formDescription, setFormDescription] = useState("");

  const { toast } = useToast();

  function fetchRules() {
    setLoading(true);
    fetch("/api/vercel/firewall")
      .then((r) => r.json())
      .then((d) => {
        setRules(d?.rules ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchRules();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formIp.trim()) {
      toast({ title: "IP / CIDR is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/vercel/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: formAction,
          ip: formIp.trim(),
          description: formDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to create rule",
          description: data?.error ?? "An error occurred",
          variant: "destructive",
        });
      } else {
        toast({ title: "Firewall rule created" });
        setShowForm(false);
        setFormIp("");
        setFormAction("deny");
        setFormDescription("");
        fetchRules();
      }
    } catch {
      toast({ title: "Failed to create rule", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(ruleId: string) {
    setDeletingId(ruleId);
    try {
      const res = await fetch(`/api/vercel/firewall?ruleId=${encodeURIComponent(ruleId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to delete rule",
          description: data?.error ?? "An error occurred",
          variant: "destructive",
        });
      } else {
        toast({ title: "Firewall rule deleted" });
        fetchRules();
      }
    } catch {
      toast({ title: "Failed to delete rule", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Firewall</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300"
        >
          {showForm ? (
            <><X className="w-3.5 h-3.5" />Cancel</>
          ) : (
            <><Plus className="w-3.5 h-3.5" />Create Rule</>
          )}
        </button>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {/* Status banner */}
        <div className="flex items-center gap-3 border border-green-500/20 bg-green-500/5 px-4 py-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Firewall Active</p>
            <p className="text-xs text-muted-foreground">
              DDoS protection and bot filtering are enabled on all deployments.
            </p>
          </div>
        </div>

        {/* Create rule form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="border border-foreground/10 bg-foreground/[0.02] p-5 mb-6"
          >
            <p className="text-sm font-medium mb-4">New Firewall Rule</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  IP / CIDR
                </label>
                <input
                  type="text"
                  value={formIp}
                  onChange={(e) => setFormIp(e.target.value)}
                  placeholder="e.g. 192.168.1.0/24"
                  className="h-9 px-3 text-sm font-mono bg-background border border-foreground/10 focus:border-foreground/30 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Action
                </label>
                <div className="flex gap-2">
                  {(["deny", "allow"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormAction(opt)}
                      className={`h-9 px-4 text-sm font-mono transition-colors duration-300 border ${
                        formAction === opt
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-foreground/10 hover:border-foreground/30"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Description <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Block known bad actor"
                  className="h-9 px-3 text-sm bg-background border border-foreground/10 focus:border-foreground/30 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-6 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Rule"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Rules list */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-foreground/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="border border-foreground/10">
            <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Custom Rules ({rules.length})
              </span>
            </div>

            {rules.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Shield className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No custom firewall rules</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Add rules to block IPs, countries, or user agents.
                </p>
              </div>
            ) : (
              rules.map((rule, i) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                    i < rules.length - 1 ? "border-b border-foreground/10" : ""
                  }`}
                >
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {rule.description ?? rule.name ?? rule.ip ?? rule.id}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {rule.ip ? `IP: ${rule.ip}` : `ID: ${rule.id}`}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 shrink-0 ${
                      rule.action === "deny"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {rule.action}
                  </span>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={deletingId === rule.id}
                        className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150 disabled:opacity-40"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background border border-foreground/10 rounded-none shadow-lg max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-medium">
                          Delete firewall rule?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                          Are you sure you want to delete this rule? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 px-5 rounded-full border-foreground/10 text-sm hover:bg-foreground/5">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(rule.id)}
                          className="h-9 px-5 rounded-full bg-foreground text-background text-sm hover:bg-foreground/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
