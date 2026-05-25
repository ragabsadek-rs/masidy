"use client";

import { useEffect, useState } from "react";
import { HardDrive, ExternalLink, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

interface Store { id: string; name: string; type: string; region?: string; }

export default function StoragePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/storage")
      .then(r => r.json())
      .then(d => { setStores(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const typeLabel: Record<string, string> = { REDIS: "KV (Redis)", POSTGRES: "Postgres", BLOB: "Blob" };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Storage</h1>
        <button className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
          <Plus className="w-3 h-3" />Create Store
        </button>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        {loading ? (
          <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-foreground/5 animate-pulse" />)}</div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <HardDrive className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No storage connected</p>
              <p className="text-xs text-muted-foreground max-w-xs">Connect KV, Postgres, or Blob storage to manage your data here.</p>
            </div>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {stores.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-4 px-4 py-4 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < stores.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <HardDrive className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{typeLabel[s.type] ?? s.type}{s.region ? ` · ${s.region}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
