"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const AGENTS = [
  {
    id: "lite",
    name: "Masidy Lite",
    tier: "Fast",
    desc: "Quick questions, fixes, and explanations. Fast and cost-efficient.",
    cost: "0.5 credits / message",
    color: "bg-green-500",
    features: ["Instant responses", "Code fixes", "Quick explanations"],
  },
  {
    id: "standard",
    name: "Masidy Standard",
    tier: "Balanced",
    desc: "Feature implementation, tests, and refactors. Balanced speed and power.",
    cost: "2 credits / message",
    color: "bg-blue-500",
    features: ["Full feature builds", "Test generation", "Code refactoring"],
  },
  {
    id: "opus",
    name: "Masidy",
    tier: "Powerful",
    desc: "Fully autonomous full-stack engineer. Plans, codes, deploys, and monitors.",
    cost: "5 credits / message",
    color: "bg-purple-500",
    features: ["End-to-end autonomy", "Architecture design", "Production deployments"],
  },
];

export default function AgentPage() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/credits/balance").then(r => r.json()).then(d => setCredits(d.balance)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">AI Agents</h1>
        {credits !== null && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Zap className="w-3 h-3 text-blue-500" />{credits} credits remaining
          </div>
        )}
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        <p className="text-xs text-muted-foreground mb-6">Choose the right Masidy agent for your task. All agents write production-ready code and deploy automatically.</p>
        <div className="flex flex-col gap-4">
          {AGENTS.map(agent => (
            <div key={agent.id} className="border border-foreground/10 p-5 hover:border-foreground/25 transition-colors duration-150 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${agent.color} flex items-center justify-center shrink-0`}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <span className="text-[10px] font-mono text-muted-foreground border border-foreground/10 px-1.5 py-0.5">{agent.tier}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{agent.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.features.map(f => (
                        <span key={f} className="text-[10px] font-mono bg-foreground/5 border border-foreground/10 px-2 py-0.5">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-muted-foreground whitespace-nowrap">{agent.cost}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-foreground/10">
                <Link href={`/builder?model=${agent.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 group-hover:text-foreground">
                  Start building with {agent.name} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
