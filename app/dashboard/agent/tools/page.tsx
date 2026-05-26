"use client";

import { useEffect, useState } from "react";
import { Cpu, Globe, Terminal, Database, Zap, Monitor, Github, CreditCard, Bell, Shield, BarChart2, FileText, Layers, Check, X } from "lucide-react";
import { AGENT_INFO } from "@/lib/agent-tools";

export const dynamic = "force-dynamic";

const TOOL_ICONS: Record<string, React.ElementType> = {
  write_file: FileText,
  read_file: FileText,
  list_files: Layers,
  install_dependency: Terminal,
  web_search: Globe,
  deploy: Zap,
  done: Check,
  create_supabase_table: Database,
  run_sql: Database,
  create_stripe_product: CreditCard,
  send_slack_message: Bell,
  create_github_repo: Github,
  push_to_github: Github,
  create_sentry_project: Shield,
  create_datadog_monitor: BarChart2,
  create_cloudflare_worker: Globe,
  create_linear_issue: FileText,
  create_notion_page: FileText,
  setup_posthog: BarChart2,
  create_netlify_site: Monitor,
};

const INTEGRATION_STATUS: Record<string, { envKey: string; label: string }> = {
  "GitHub": { envKey: "GITHUB_TOKEN", label: "GITHUB_TOKEN" },
  "Slack": { envKey: "SLACK_WEBHOOK_URL", label: "SLACK_WEBHOOK_URL" },
  "Sentry": { envKey: "SENTRY_AUTH_TOKEN", label: "SENTRY_AUTH_TOKEN" },
  "Datadog": { envKey: "DATADOG_API_KEY", label: "DATADOG_API_KEY" },
  "Cloudflare": { envKey: "CLOUDFLARE_API_TOKEN", label: "CLOUDFLARE_API_TOKEN" },
  "Linear": { envKey: "LINEAR_API_KEY", label: "LINEAR_API_KEY" },
  "Notion": { envKey: "NOTION_API_KEY", label: "NOTION_API_KEY" },
  "PostHog": { envKey: "POSTHOG_API_KEY", label: "POSTHOG_API_KEY" },
  "Netlify": { envKey: "NETLIFY_AUTH_TOKEN", label: "NETLIFY_AUTH_TOKEN" },
};

const AGENTS = [
  { tier: "lite" as const, color: "bg-green-500" },
  { tier: "standard" as const, color: "bg-blue-500" },
  { tier: "opus" as const, color: "bg-purple-500" },
];

export default function AgentToolsPage() {
  const [selectedTier, setSelectedTier] = useState<"lite" | "standard" | "opus">("lite");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const agent = AGENT_INFO[selectedTier];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Agent Tools</h1>
        <Cpu className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 px-6 py-6 max-w-4xl">
        {/* Agent selector */}
        <div className="flex gap-2 mb-8">
          {AGENTS.map(({ tier, color }) => {
            const info = AGENT_INFO[tier];
            return (
              <button key={tier} onClick={() => setSelectedTier(tier)}
                className={`flex items-center gap-2 px-4 py-2 border transition-all duration-150 text-sm ${selectedTier === tier ? "border-foreground bg-foreground/5" : "border-foreground/10 hover:border-foreground/25"}`}>
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {info.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-foreground/10" />)}
          </div>
        ) : (
          <>
            {/* Agent info */}
            <div className="border border-foreground/10 p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedTier === "opus" ? "bg-purple-500" : selectedTier === "standard" ? "bg-blue-500" : "bg-green-500"}`}>
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">{agent.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>
                  <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                    <span>{agent.creditsPerMessage} credits/message</span>
                    <span>·</span>
                    <span>Up to {agent.maxIterations} iterations</span>
                    <span>·</span>
                    <span>{agent.tools.length} tools</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mb-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Capabilities</p>
              <div className="flex flex-col gap-2">
                {agent.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools list */}
            <div className="mb-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Available Tools ({agent.tools.length})</p>
              <div className="border border-foreground/10">
                {agent.tools.map((tool, i) => {
                  const Icon = TOOL_ICONS[tool] ?? Cpu;
                  return (
                    <div key={tool} className={`flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < agent.tools.length - 1 ? "border-b border-foreground/10" : ""}`}>
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-mono">{tool}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Integration status */}
            {selectedTier !== "lite" && (
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Integration Status</p>
                <div className="border border-foreground/10">
                  {Object.entries(INTEGRATION_STATUS).map(([name, { label }], i, arr) => (
                    <div key={name} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-foreground/10" : ""}`}>
                      <span className="text-sm">{name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground">— add to env vars to enable</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
