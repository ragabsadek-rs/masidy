import Link from "next/link";

export const metadata = { title: "How credits work — Masidy Blog" };

export default function Post() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">← Blog</Link>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono text-muted-foreground">May 25, 2025</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs font-mono text-muted-foreground">2 min read</span>
        </div>
        <h1 className="text-4xl font-display tracking-tight mb-8">How the Masidy credit system works</h1>
        <div className="text-muted-foreground leading-relaxed space-y-6">
          <p>Masidy uses a simple credit system — you buy credits in advance and spend them as you use the platform. No subscriptions, no monthly minimums, no surprises.</p>
          <h2 className="text-xl font-display text-foreground mt-8 mb-4">What costs credits</h2>
          <div className="border border-foreground/10">
            {[
              { action: "Masidy Lite message",     cost: "0.5 credits" },
              { action: "Masidy Standard message", cost: "2 credits"   },
              { action: "Masidy Max message",      cost: "5 credits"   },
              { action: "Deploy project",          cost: "1 credit"    },
              { action: "Custom domain",           cost: "2 credits"   },
              { action: "Storage (per GB/mo)",     cost: "3 credits"   },
            ].map((row, i, arr) => (
              <div key={row.action} className={`flex items-center justify-between px-4 py-3 text-sm ${i < arr.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <span>{row.action}</span>
                <span className="font-mono text-xs">{row.cost}</span>
              </div>
            ))}
          </div>
          <h2 className="text-xl font-display text-foreground mt-8 mb-4">Credit packs</h2>
          <p>You can buy credits in packs of $5, $10, $20, $50, or $100. Larger packs give you more credits per dollar. Credits never expire.</p>
          <h2 className="text-xl font-display text-foreground mt-8 mb-4">Free credits</h2>
          <p>Every new account gets 10 free credits on signup — enough to build and deploy your first app with Masidy Lite.</p>
        </div>
        <div className="mt-12 pt-8 border-t border-foreground/10">
          <Link href="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 h-10 text-sm font-medium hover:bg-foreground/90 transition-colors duration-150">
            Buy credits →
          </Link>
        </div>
      </div>
    </div>
  );
}
