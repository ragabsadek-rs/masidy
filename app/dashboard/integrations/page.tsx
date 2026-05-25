"use client";

import { useEffect, useState } from "react";
import { Cpu, ExternalLink, Plus, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

interface Integration { id: string; slug: string; name?: string; createdAt?: number; }

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
        <a href="https://vercel.com/integrations" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
          <Plus className="w-3 h-3" />Browse Integrations
        </a>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        {loading ? (
          <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-foreground/5 animate-pulse" />)}</div>
        ) : integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Cpu className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No integrations installed</p>
              <p className="text-xs text-muted-foreground max-w-xs">Connect tools like GitHub, Slack, Datadog, and more from the Vercel Marketplace.</p>
            </div>
            <a href="https://vercel.com/integrations" target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline">Browse Marketplace →</a>
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
                <a href={`https://vercel.com/integrations/${item.slug}`} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
