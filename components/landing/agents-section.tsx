"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const agents = [
  {
    id: "lite",
    name: "Masidy Lite",
    model: "Claude Haiku",
    price: "0.5 cr / message",
    color: "bg-green-500",
    tagline: "Fast. Focused. Instant.",
    description: "Describe what you want. Masidy Lite writes the code and deploys it live in seconds.",
    tools: [
      "Write any file (pages, components, API routes)",
      "Install npm dependencies",
      "Search the web for docs",
      "Deploy to Vercel automatically",
    ],
    cta: "Try Lite",
    href: "/builder?model=lite",
  },
  {
    id: "standard",
    name: "Masidy Standard",
    model: "Claude Sonnet",
    price: "2 cr / message",
    color: "bg-blue-500",
    tagline: "Full-stack. Production-ready.",
    description: "Builds complete apps with database, payments, notifications, and version control — all wired up.",
    tools: [
      "Everything in Lite",
      "Create Supabase tables & run migrations",
      "Set up Stripe products & checkout",
      "Send Slack notifications",
      "Create GitHub repos & push code",
    ],
    cta: "Try Standard",
    href: "/builder?model=standard",
    popular: true,
  },
  {
    id: "opus",
    name: "Masidy Max",
    model: "Claude Opus",
    price: "5 cr / message",
    color: "bg-purple-500",
    tagline: "Autonomous. End-to-end.",
    description: "A fully autonomous AI engineer. Give it a goal — it plans, builds, deploys, monitors, and documents everything.",
    tools: [
      "Everything in Standard",
      "Sentry error tracking setup",
      "Datadog performance monitors",
      "Cloudflare Workers deployment",
      "Linear issue tracking",
      "Notion documentation",
      "PostHog analytics",
      "19+ MCP tools total",
    ],
    cta: "Try Max",
    href: "/builder?model=opus",
  },
];

export function AgentsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            AI Agents
          </span>
          <h2 className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Three agents.
            <br />
            <span className="text-muted-foreground">One platform.</span>
          </h2>
          <p className="text-xl text-muted-foreground mt-6 max-w-2xl">
            Each agent is powered by a different Claude model and has access to different tools. Pick the one that matches your task.
          </p>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-foreground/10">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className={`relative bg-background p-8 lg:p-10 flex flex-col transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${agent.popular ? "border-2 border-foreground lg:-my-4 lg:py-14" : ""}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {agent.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-background text-xs font-mono uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              {/* Agent header */}
              <div className="flex items-center gap-3 mb-6">
                <span className={`w-3 h-3 rounded-full ${agent.color}`} />
                <div>
                  <p className="text-lg font-display">{agent.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{agent.model} · {agent.price}</p>
                </div>
              </div>

              <p className="text-2xl font-display mb-3">{agent.tagline}</p>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed flex-1">{agent.description}</p>

              {/* Tools */}
              <ul className="space-y-2 mb-8">
                {agent.tools.map((tool) => (
                  <li key={tool} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{tool}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={agent.href}
                className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-300 group ${agent.popular ? "bg-foreground text-background hover:bg-foreground/90" : "border border-foreground/20 hover:border-foreground hover:bg-foreground/5"}`}
              >
                {agent.cta}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          All agents include automatic Vercel deployment and 10 free credits on signup.{" "}
          <Link href="/auth/signup" className="underline underline-offset-4 hover:text-foreground transition-colors duration-300">
            Start building free
          </Link>
        </p>
      </div>
    </section>
  );
}
