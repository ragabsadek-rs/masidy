import Link from "next/link";
import { Shield, Lock, Eye, FileCheck, Server, Key } from "lucide-react";

export const metadata = { title: "Security — Masidy" };

const features = [
  { icon: Lock,      title: "End-to-end encryption",    desc: "All data in transit is encrypted with TLS 1.3. Data at rest uses AES-256 encryption." },
  { icon: Shield,    title: "DDoS protection",           desc: "All deployments are protected by enterprise-grade DDoS mitigation at the edge." },
  { icon: Eye,       title: "Zero-trust architecture",   desc: "Every request is authenticated and authorized. No implicit trust between services." },
  { icon: FileCheck, title: "Secure credential storage", desc: "Environment variables and secrets are encrypted at rest and never logged." },
  { icon: Server,    title: "Isolated deployments",      desc: "Each user's deployments run in isolated environments with no cross-tenant access." },
  { icon: Key,       title: "Row-level security",        desc: "Database access is enforced at the row level — users can only access their own data." },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Security</h1>
        <p className="text-muted-foreground mb-12">Security is built into every layer of Masidy — from infrastructure to application.</p>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {features.map((f) => (
            <div key={f.title} className="border border-foreground/10 p-5 hover:border-foreground/20 transition-colors duration-150">
              <div className="flex items-center gap-3 mb-2">
                <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <h2 className="text-sm font-medium">{f.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="border border-foreground/10 p-6">
          <h2 className="text-sm font-medium mb-2">Report a vulnerability</h2>
          <p className="text-xs text-muted-foreground mb-4">If you discover a security vulnerability, please report it responsibly. We take all reports seriously and will respond within 48 hours.</p>
          <a href="mailto:security@masidy.app" className="text-sm text-foreground underline underline-offset-4 hover:no-underline">security@masidy.app</a>
        </div>
      </div>
    </div>
  );
}
