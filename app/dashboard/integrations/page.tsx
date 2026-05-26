"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cpu, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface Integration { id: string; slug: string; name?: string; provider?: string; category?: string; description?: string; }

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  async function loadIntegrations() {
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/installed");
      const data = await res.json();
      setIntegrations(Array.isArray(data) ? data : []);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUninstall(slug: string) {
    setRemoving(slug);
    try {
      await fetch(`/api/marketplace/install?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      await loadIntegrations();
    } finally {
      setRemoving(null);
    }
  }

  useEffect(() => {
    loadIntegrations();
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <div>
          <h1 className="text-sm font-medium">Integrations</h1>
          <p className="text-xs text-muted-foreground">Manage installed integrations and connect new providers.</p>
        </div>
        <Link href="/marketplace" className="text-sm font-medium text-primary hover:text-primary/80">
          Browse marketplace
        </Link>
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
            <Button asChild>
              <Link href="/marketplace">Browse marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="border border-foreground/10 rounded-3xl overflow-hidden">
            {integrations.map((item, index) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 px-4 py-4 transition-colors duration-150 ${index < integrations.length - 1 ? "border-b border-foreground/10" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.name ?? item.slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{item.provider ?? item.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUninstall(item.slug)}
                      disabled={removing === item.slug}
                    >
                      {removing === item.slug ? "Removing..." : "Remove"}
                    </Button>
                    <Link
                      href={`/dashboard/integrations/${item.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Details
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.category && <span className="rounded-full border border-foreground/10 bg-background px-2 py-1">{item.category}</span>}
                  <span className="rounded-full border border-foreground/10 bg-background px-2 py-1">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
