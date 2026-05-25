"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

interface FirewallRule { id: string; name?: string; action: string; }

export default function FirewallPage() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/firewall")
      .then(r => r.json())
      .then(d => { setRules(d?.rules ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Firewall</h1>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        <div className="flex items-center gap-3 border border-green-500/20 bg-green-500/5 px-4 py-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Firewall Active</p>
            <p className="text-xs text-muted-foreground">DDoS protection and bot filtering are enabled on all deployments.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-foreground/5 animate-pulse" />)}</div>
        ) : (
          <div className="border border-foreground/10">
            <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Custom Rules ({rules.length})</span>
            </div>
            {rules.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Shield className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No custom firewall rules</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add rules to block IPs, countries, or user agents.</p>
              </div>
            ) : rules.map((rule, i) => (
              <div key={rule.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < rules.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{rule.name ?? rule.id}</p>
                  <p className="text-xs text-muted-foreground font-mono">Action: {rule.action}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 ${rule.action === "deny" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-600"}`}>
                  {rule.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
