"use client";

import { useEffect, useState } from "react";
import { Cpu, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { IntegrationSetupDetails } from "@/components/dashboard/integration-setup-details";

export const dynamic = "force-dynamic";

interface Integration {
  id: string;
  slug: string;
  name?: string;
}

interface CuratedIntegration {
  slug: string;
  name: string;
  description: string;
  apiBaseUrl?: string;
  docsUrl?: string;
  callbackPath?: string;
  notes?: string;
}

const CURATED: CuratedIntegration[] = [
  {
    slug: "github",
    name: "GitHub",
    description: "Connect your GitHub repositories for automatic deployments.",
    apiBaseUrl: "https://api.github.com",
    docsUrl: "https://docs.github.com/en/rest",
    callbackPath: "/api/auth/callback/github",
    notes: "Requires a GitHub OAuth App. Set the callback URL above in your GitHub App settings.",
  },
  {
    slug: "slack",
    name: "Slack",
    description: "Get deployment notifications and alerts in Slack channels.",
    apiBaseUrl: "https://slack.com/api",
    docsUrl: "https://api.slack.com/docs",
    callbackPath: "/api/auth/callback/slack",
    notes: "Create a Slack App and add the OAuth redirect URL above.",
  },
  {
    slug: "stripe",
    name: "Stripe",
    description: "Accept payments and manage subscriptions.",
    apiBaseUrl: "https://api.stripe.com/v1",
    docsUrl: "https://stripe.com/docs/api",
    callbackPath: "/api/webhooks/stripe",
    notes: "Add the webhook URL above in your Stripe Dashboard → Webhooks.",
  },
  {
    slug: "datadog",
    name: "Datadog",
    description: "Monitor performance, logs, and infrastructure metrics.",
    apiBaseUrl: "https://api.datadoghq.com/api/v1",
    docsUrl: "https://docs.datadoghq.com/api/latest/",
    notes: "Requires a Datadog API key and Application key from your Datadog account settings.",
  },
  {
    slug: "notion",
    name: "Notion",
    description: "Sync content and data with your Notion workspace.",
    apiBaseUrl: "https://api.notion.com/v1",
    docsUrl: "https://developers.notion.com/reference/intro",
    callbackPath: "/api/auth/callback/notion",
    notes: "Create a Notion integration at notion.so/my-integrations and add the redirect URI above.",
  },
  {
    slug: "aws",
    name: "AWS",
    description: "Deploy to AWS services including S3, Lambda, and CloudFront.",
    apiBaseUrl: "https://aws.amazon.com",
    docsUrl: "https://docs.aws.amazon.com/",
    notes: "Requires AWS Access Key ID and Secret Access Key with appropriate IAM permissions.",
  },
  {
    slug: "planetscale",
    name: "PlanetScale",
    description: "Serverless MySQL platform built for scale.",
    apiBaseUrl: "https://api.planetscale.com/v1",
    docsUrl: "https://planetscale.com/docs/reference/planetscale-api-reference",
    notes: "Connect via a PlanetScale service token or use the Vercel integration for automatic env var injection.",
  },
  {
    slug: "sentry",
    name: "Sentry",
    description: "Track errors and performance issues in real time.",
    apiBaseUrl: "https://sentry.io/api/0",
    docsUrl: "https://docs.sentry.io/api/",
    callbackPath: "/api/auth/callback/sentry",
    notes: "Install via the Vercel marketplace to automatically inject SENTRY_DSN into your deployments.",
  },
  {
    slug: "upstash",
    name: "Upstash",
    description: "Serverless Redis and Kafka for low-latency data access.",
    apiBaseUrl: "https://api.upstash.com",
    docsUrl: "https://docs.upstash.com/",
    notes: "Use the Vercel integration to automatically inject UPSTASH_REDIS_REST_URL and token.",
  },
];

export default function IntegrationsPage() {
  const [installed, setInstalled] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/vercel/integrations")
      .then((r) => r.json())
      .then((d) => {
        setInstalled(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const installedSlugs = new Set(installed.map((i) => i.slug));

  async function handleInstall(slug: string, name: string) {
    setInstalling(slug);
    try {
      const res = await fetch("/api/vercel/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: `Failed to install ${name}`, description: data?.error ?? "An error occurred", variant: "destructive" });
        return;
      }

      toast({ title: `Opening ${name} installation`, description: "Redirecting to Vercel marketplace…" });
      window.open(data.installUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: `Failed to install ${name}`, description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Integrations</h1>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-foreground/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Installed integrations not in curated list */}
            {installed.filter((i) => !CURATED.some((c) => c.slug === i.slug)).length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Other Installed</p>
                <div className="border border-foreground/10">
                  {installed
                    .filter((i) => !CURATED.some((c) => c.slug === i.slug))
                    .map((item, idx, arr) => (
                      <div key={item.id} className={`flex items-center gap-4 px-4 py-4 hover:bg-foreground/[0.02] transition-colors duration-150 ${idx < arr.length - 1 ? "border-b border-foreground/10" : ""}`}>
                        <div className="w-8 h-8 border border-foreground/10 flex items-center justify-center shrink-0">
                          <Cpu className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.name ?? item.slug}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.slug}</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 bg-foreground/5 text-muted-foreground shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Installed
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Curated integrations */}
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Popular Integrations</p>
            <div className="border border-foreground/10">
              {CURATED.map((integration, i) => {
                const isInstalled = installedSlugs.has(integration.slug);
                const isInstalling = installing === integration.slug;
                const isExpanded = expanded === integration.slug;

                return (
                  <div key={integration.slug} className={`${i < CURATED.length - 1 ? "border-b border-foreground/10" : ""}`}>
                    <div
                      className="flex items-center gap-4 px-4 py-4 hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : integration.slug)}
                    >
                      <div className="w-8 h-8 border border-foreground/10 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                      {isInstalled ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 bg-foreground/5 text-muted-foreground shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Installed
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInstall(integration.slug, integration.name); }}
                          disabled={isInstalling}
                          className="flex items-center gap-1.5 bg-foreground text-background text-xs font-medium px-5 h-8 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50 shrink-0"
                        >
                          {isInstalling ? "Opening…" : <><span>Install</span><ExternalLink className="w-3 h-3" /></>}
                        </button>
                      )}
                    </div>

                    {/* Setup details — shown when expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-foreground/[0.01]">
                        <IntegrationSetupDetails
                          apiBaseUrl={integration.apiBaseUrl}
                          docsUrl={integration.docsUrl}
                          callbackPath={integration.callbackPath}
                          notes={integration.notes}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
}
