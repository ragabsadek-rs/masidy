import Link from "next/link";
import { ArrowRight, Code2, Zap, Globe, KeyRound, HardDrive } from "lucide-react";

export const metadata = { title: "Documentation — Masidy" };

const sections = [
  {
    icon: Zap,
    title: "Getting Started",
    desc: "Build and deploy your first app in under 60 seconds.",
    href: "/docs/getting-started",
    items: ["Quick start", "How credits work", "Your first deployment"],
  },
  {
    icon: Code2,
    title: "Builder",
    desc: "Learn how to use the AI builder to create full-stack apps.",
    href: "/docs/builder",
    items: ["Writing prompts", "Editing code", "File structure"],
  },
  {
    icon: Globe,
    title: "Deployments",
    desc: "Manage deployments, domains, and rollbacks.",
    href: "/docs/deployments",
    items: ["Deploy a project", "Custom domains", "Instant rollback"],
  },
  {
    icon: KeyRound,
    title: "Environment Variables",
    desc: "Securely manage secrets and configuration.",
    href: "/docs/env",
    items: ["Adding variables", "Environments", "Best practices"],
  },
  {
    icon: HardDrive,
    title: "Storage",
    desc: "Connect databases and file storage to your apps.",
    href: "/docs/storage",
    items: ["Postgres", "KV store", "Blob storage"],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Documentation</h1>
        <p className="text-muted-foreground mb-12">Everything you need to build and ship with Masidy.</p>

        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((s) => (
            <div key={s.title} className="border border-foreground/10 p-6 hover:border-foreground/25 transition-colors duration-150 group">
              <div className="flex items-center gap-3 mb-3">
                <s.icon className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-sm font-medium">{s.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{s.desc}</p>
              <ul className="flex flex-col gap-1.5">
                {s.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer">
                    <ArrowRight className="w-3 h-3 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border border-foreground/10 p-6">
          <h2 className="text-sm font-medium mb-2">API Reference</h2>
          <p className="text-xs text-muted-foreground mb-4">Integrate Masidy into your own tools and workflows.</p>
          <Link href="/docs/api"
            className="inline-flex items-center gap-2 text-xs font-medium hover:text-foreground text-muted-foreground transition-colors duration-150">
            View API docs <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
