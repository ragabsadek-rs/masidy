import Link from "next/link";

export const metadata = { title: "Changelog — Masidy" };

const entries = [
  {
    date: "May 2025",
    version: "1.0.0",
    tag: "Launch",
    changes: [
      "AI Builder — describe any app, get production-ready code",
      "One-click deploy to global edge network",
      "Monaco code editor with syntax highlighting",
      "Live preview with desktop/tablet/mobile viewports",
      "Credit-based billing — pay only for what you use",
      "Supabase auth — email + GitHub OAuth",
      "Dashboard — deployments, domains, env vars, logs, analytics",
      "Stripe checkout — 5 credit pack sizes ($5–$100)",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Back</Link>
        <h1 className="text-4xl font-display tracking-tight mb-2">Changelog</h1>
        <p className="text-muted-foreground mb-12">What's new in Masidy.</p>
        <div className="flex flex-col gap-12">
          {entries.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-mono text-muted-foreground">{entry.date}</span>
                <span className="text-xs font-mono bg-foreground text-background px-2 py-0.5">{entry.version}</span>
                <span className="text-xs font-mono border border-foreground/15 px-2 py-0.5 text-muted-foreground">{entry.tag}</span>
              </div>
              <ul className="flex flex-col gap-2">
                {entry.changes.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500 shrink-0 mt-0.5">+</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
