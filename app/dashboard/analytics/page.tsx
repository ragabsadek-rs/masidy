"use client";

import { useEffect, useState } from "react";
import { BarChart2, Users, Eye, Clock, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const [data, setData] = useState<{ pageviews?: number; visitors?: number; bounceRate?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Page Views", value: data?.pageviews ?? 0, icon: Eye },
    { label: "Unique Visitors", value: data?.visitors ?? 0, icon: Users },
    { label: "Bounce Rate", value: data?.bounceRate ? `${data.bounceRate}%` : "—", icon: TrendingUp },
    { label: "Avg. Duration", value: "—", icon: Clock },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Analytics</h1>
        <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
          <ExternalLink className="w-3 h-3" />Open in Vercel
        </a>
      </div>
      <div className="flex-1 px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-foreground/5 animate-pulse" />)}
          </div>
        ) : !data || (data.pageviews === 0 && data.visitors === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <BarChart2 className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No analytics data yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">Analytics will appear here once your site receives traffic. Make sure Vercel Analytics is enabled.</p>
            </div>
            <a href="https://vercel.com/docs/analytics" target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline">Enable Vercel Analytics →</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="border border-foreground/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-3xl font-display">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
