"use client";

import { useEffect, useState } from "react";
import { BarChart2, Users, Eye, TrendingUp, FileText, Info } from "lucide-react";

export const dynamic = "force-dynamic";

interface TimeSeriesPoint {
  date: string;
  pageviews: number;
  visitors: number;
}

interface TopPage {
  path: string;
  pageviews: number;
  visitors: number;
}

interface AnalyticsData {
  mock: boolean;
  pageviews: number;
  visitors: number;
  topPages: TopPage[];
  timeSeries: TimeSeriesPoint[];
}

// ── Skeleton helpers ──────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="border border-foreground/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 animate-pulse bg-foreground/10" />
        <div className="w-24 h-3 animate-pulse bg-foreground/10" />
      </div>
      <div className="w-20 h-8 animate-pulse bg-foreground/10" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="border border-foreground/10 p-4">
      <div className="w-32 h-4 animate-pulse bg-foreground/10 mb-6" />
      <div className="flex items-end gap-1 h-32">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse bg-foreground/10"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="border border-foreground/10">
      <div className="px-4 py-3 border-b border-foreground/10">
        <div className="w-24 h-4 animate-pulse bg-foreground/10" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 last:border-b-0">
          <div className="w-40 h-3 animate-pulse bg-foreground/10" />
          <div className="flex gap-6">
            <div className="w-12 h-3 animate-pulse bg-foreground/10" />
            <div className="w-12 h-3 animate-pulse bg-foreground/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bar chart (CSS only) ──────────────────────────────────────────────────

function TimeSeriesChart({ data }: { data: TimeSeriesPoint[] }) {
  const maxPv = Math.max(...data.map((d) => d.pageviews), 1);

  return (
    <div className="border border-foreground/10 p-4">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
        Pageviews — last 14 days
      </p>
      <div className="flex items-end gap-1 h-32">
        {data.map((point) => {
          const pct = Math.round((point.pageviews / maxPv) * 100);
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={`${point.date}: ${point.pageviews} views, ${point.visitors} visitors`}
            >
              <div
                className="w-full bg-foreground/20 group-hover:bg-foreground/40 transition-colors duration-300"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis: first and last date */}
      {data.length > 0 && (
        <div className="flex justify-between mt-2">
          <span className="text-xs font-mono text-muted-foreground">
            {data[0].date}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {data[data.length - 1].date}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/analytics")
      .then((r) => r.json())
      .then((d: AnalyticsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Page Views",
      value: data?.pageviews ?? 0,
      icon: Eye,
    },
    {
      label: "Unique Visitors",
      value: data?.visitors ?? 0,
      icon: Users,
    },
    {
      label: "Top Pages",
      value: data?.topPages?.length ?? 0,
      icon: FileText,
    },
    {
      label: "Data Points",
      value: data?.timeSeries?.length ?? 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium">Analytics</h1>
          {!loading && data && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">live</span>
            </span>
          )}
        </div>
        <BarChart2 className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Mock data notice */}
        {!loading && data?.mock && (
          <div className="flex items-start gap-3 border border-foreground/10 px-4 py-3 bg-foreground/[0.02]">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect Vercel to see real data — add{" "}
              <span className="font-mono">VERCEL_ACCESS_TOKEN</span> and{" "}
              <span className="font-mono">VERCEL_TEAM_ID</span> to your environment
              variables.
            </p>
          </div>
        )}

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="border border-foreground/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-3xl font-display">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Time-series chart */}
        {loading ? (
          <ChartSkeleton />
        ) : data?.timeSeries && data.timeSeries.length > 0 ? (
          <TimeSeriesChart data={data.timeSeries} />
        ) : null}

        {/* Top pages table */}
        {loading ? (
          <TableSkeleton />
        ) : data?.topPages && data.topPages.length > 0 ? (
          <div className="border border-foreground/10">
            {/* Table header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Top Pages
              </span>
              <div className="flex gap-8">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Views
                </span>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Visitors
                </span>
              </div>
            </div>

            {/* Rows */}
            {data.topPages.map((page, i) => {
              const maxPv = data.topPages[0]?.pageviews ?? 1;
              const barPct = Math.round((page.pageviews / maxPv) * 100);
              return (
                <div
                  key={page.path}
                  className="relative flex items-center justify-between px-4 py-3 border-b border-foreground/10 last:border-b-0 group"
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-foreground/[0.03] group-hover:bg-foreground/[0.05] transition-all duration-300"
                    style={{ width: `${barPct}%` }}
                  />
                  <div className="relative flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-mono truncate">{page.path}</span>
                  </div>
                  <div className="relative flex gap-8 shrink-0">
                    <span className="text-sm font-mono w-16 text-right">
                      {page.pageviews.toLocaleString()}
                    </span>
                    <span className="text-sm font-mono w-16 text-right text-muted-foreground">
                      {page.visitors.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <BarChart2 className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No analytics data yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Analytics will appear here once your site receives traffic.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
