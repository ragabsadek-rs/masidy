"use client";

import { Globe, RefreshCw, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CDNPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">CDN & Edge</h1>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        <div className="flex items-center gap-3 border border-green-500/20 bg-green-500/5 px-4 py-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">CDN Active</p>
            <p className="text-xs text-muted-foreground">Your deployments are served from 100+ edge locations worldwide with automatic caching.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Edge Locations", value: "100+" },
            { label: "Cache Hit Rate", value: "—" },
            { label: "Avg. Latency", value: "—" },
          ].map(stat => (
            <div key={stat.label} className="border border-foreground/10 p-4">
              <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-2xl font-display">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="border border-foreground/10">
          <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02] flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Cache Control</span>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              <Trash2 className="w-3 h-3" />Purge all cache
            </button>
          </div>
          <div className="px-4 py-8 text-center">
            <Globe className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Cache is managed automatically</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Static assets are cached at the edge. API routes bypass cache by default.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
