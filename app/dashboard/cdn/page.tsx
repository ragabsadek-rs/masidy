"use client";

import { useState } from "react";
import { Globe, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const dynamic = "force-dynamic";

export default function CDNPage() {
  const { toast } = useToast();
  const [purging, setPurging] = useState(false);

  async function handlePurgeCache() {
    setPurging(true);
    try {
      const res = await fetch("/api/vercel/cdn", { method: "POST" });
      const data = await res.json();

      if (!res.ok || data?.error) {
        toast({
          title: "Purge failed",
          description: data?.error ?? "Could not purge CDN cache. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cache purged successfully",
          description: "All edge caches have been cleared.",
        });
      }
    } catch {
      toast({
        title: "Purge failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurging(false);
    }
  }

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
            <p className="text-xs text-muted-foreground">
              Your deployments are served from 100+ edge locations worldwide with automatic caching.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Edge Locations", value: "100+" },
            { label: "Cache Hit Rate", value: "—" },
            { label: "Avg. Latency", value: "—" },
          ].map((stat) => (
            <div key={stat.label} className="border border-foreground/10 p-4">
              <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-2xl font-display">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="border border-foreground/10">
          <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02] flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Cache Control
            </span>
            <button
              onClick={handlePurgeCache}
              disabled={purging}
              className="flex items-center gap-1.5 bg-foreground text-background text-sm font-medium px-6 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${purging ? "animate-spin" : ""}`} />
              {purging ? "Purging…" : "Purge Cache"}
            </button>
          </div>
          <div className="px-4 py-8 text-center">
            <Globe className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Cache is managed automatically</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Static assets are cached at the edge. API routes bypass cache by default.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
