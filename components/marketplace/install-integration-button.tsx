"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Integration } from "@/lib/integrations";

interface InstallIntegrationButtonProps {
  integration: Integration;
}

export function InstallIntegrationButton({ integration }: InstallIntegrationButtonProps) {
  const [installed, setInstalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/marketplace/installed")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (!Array.isArray(data)) return;
        setInstalled(data.some((item) => item.slug === integration.slug));
      })
      .catch(() => {
        if (!mounted) return;
      });

    return () => {
      mounted = false;
    };
  }, [integration.slug]);

  async function installIntegration() {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/marketplace/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: integration.slug }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Install failed");
      }

      setInstalled(true);
      setFeedback(data.alreadyInstalled ? "Integration is already installed." : "Integration installed successfully.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Installation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:w-full">
      {installed ? (
        <div className="grid gap-3">
          <Button asChild variant="secondary" size="lg">
            <Link href="/dashboard/integrations">Manage integration</Link>
          </Button>
          <p className="text-sm text-foreground/80">This integration is installed and ready to use in your workspace.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <Button onClick={installIntegration} size="lg" disabled={loading}>
            {loading ? "Installing..." : "Install integration"}
          </Button>
          <p className="text-sm text-muted-foreground">Install now to enable provider sync, automation, and dashboard access.</p>
        </div>
      )}

      {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
    </div>
  );
}
