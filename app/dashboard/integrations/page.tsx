"use client";

import { useEffect, useState } from "react";
import { Cpu, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

interface Integration { id: string; slug: string; name?: string; }

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/integrations")
      .then(r => r.json())
      .then(d => { setIntegrations(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Integrations</h1>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        {loading ? (
          <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-foreground/5 animate-pulse" />)}</div>
        ) : integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Cpu className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No integrations installed</p>
              <p className="text-xs text-muted-foreground max-w-xs">Connect tools like GitHub, Slack, Datadog, and more to extend your Masidy workspace.</p>
            </div>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {integrations.map((item, i) => (
              <div key={item.id} className={`flex items-center gap-4 px-4 py-4 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < integrations.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <div className="w-8 h-8 border border-foreground/10 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name ?? item.slug}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.slug}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
