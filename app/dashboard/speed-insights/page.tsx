"use client";

import { Zap, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const metrics = [
  { label: "First Contentful Paint", key: "FCP", good: "< 1.8s", desc: "Time until first content is painted" },
  { label: "Largest Contentful Paint", key: "LCP", good: "< 2.5s", desc: "Time until largest content element is visible" },
  { label: "Cumulative Layout Shift", key: "CLS", good: "< 0.1", desc: "Visual stability of the page" },
  { label: "First Input Delay", key: "FID", good: "< 100ms", desc: "Time from first interaction to browser response" },
  { label: "Interaction to Next Paint", key: "INP", good: "< 200ms", desc: "Responsiveness to user interactions" },
  { label: "Time to First Byte", key: "TTFB", good: "< 800ms", desc: "Server response time" },
];

export default function SpeedInsightsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Speed Insights</h1>
        <a href="https://vercel.com/speed-insights" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
          <ExternalLink className="w-3 h-3" />Open in Vercel
        </a>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center mb-8">
          <Zap className="w-10 h-10 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-medium mb-1">No Speed Insights data yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">Real User Monitoring data will appear here once your site receives traffic with Speed Insights enabled.</p>
          </div>
          <a href="https://vercel.com/docs/speed-insights" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline">Enable Speed Insights →</a>
        </div>

        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Core Web Vitals Reference</p>
        <div className="border border-foreground/10">
          {metrics.map((m, i) => (
            <div key={m.key} className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < metrics.length - 1 ? "border-b border-foreground/10" : ""}`}>
              <span className="text-xs font-mono font-medium w-12 shrink-0 text-blue-500">{m.key}</span>
              <div className="flex-1">
                <p className="text-sm">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <span className="text-xs font-mono text-green-600 bg-green-500/10 px-2 py-0.5 shrink-0">{m.good}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
