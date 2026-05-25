"use client";

import { useEffect, useState } from "react";
import { Bot, Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const AGENTS = [
  { id: "lite",     name: "Masidy Lite",     model: "claude-haiku-4-5",  desc: "Quick questions, fixes, and explanations. Fast and cost-efficient.", cost: "0.5 credits/msg", color: "bg-green-500" },
  { id: "standard", name: "Masidy Standard", model: "claude-sonnet-4-6", desc: "Feature implementation, tests, and refactors. Balanced speed and power.", cost: "2 credits/msg", color: "bg-blue-500" },
  { id: "opus",     name: "Masidy",          model: "claude-opus-4-7",   desc: "Fully autonomous full-stack engineer. Plans, codes, deploys, monitors.", cost: "5 credits/msg", color: "bg-purple-500" },
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
            <Zap className="w-3 h-3 text-blue-500" />{credits} credits
          </div>
        )}
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        <p className="text-xs text-muted-foreground mb-6">Your Masidy AI agents are powered by Anthropic Claude. Choose the right agent for your task.</p>
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
                      <span className="text-[10px] font-mono text-muted-foreground border border-foreground/10 px-1.5 py-0.5">{agent.model}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-muted-foreground">{agent.cost}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-foreground/10">
                <Link href={`/builder?model=${agent.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium hover:text-foreground text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
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
