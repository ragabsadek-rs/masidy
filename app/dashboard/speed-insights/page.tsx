"use client";

import { useEffect, useState } from "react";
import { Zap, Info } from "lucide-react";

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────

interface TimeSeriesPoint {
  date: string;
  lcp: number;
  fcp: number;
  cls: number;
  ttfb: number;
}

interface SpeedData {
  mock: boolean;
  score: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  timeSeries: TimeSeriesPoint[];
}

// ── Thresholds & helpers ──────────────────────────────────────────────────

type Status = "good" | "needs-improvement" | "poor";

function lcpStatus(v: number): Status {
  if (v <= 2.5) return "good";
  if (v <= 4.0) return "needs-improvement";
  return "poor";
}

function fidStatus(v: number): Status {
  if (v <= 100) return "good";
  if (v <= 300) return "needs-improvement";
  return "poor";
}

function clsStatus(v: number): Status {
  if (v <= 0.1) return "good";
  if (v <= 0.25) return "needs-improvement";
  return "poor";
}

function fcpStatus(v: number): Status {
  if (v <= 1.8) return "good";
  if (v <= 3.0) return "needs-improvement";
  return "poor";
}

function ttfbStatus(v: number): Status {
  if (v <= 0.8) return "good";
  if (v <= 1.8) return "needs-improvement";
  return "poor";
}

function statusDot(s: Status) {
  const color =
    s === "good"
      ? "bg-green-500"
      : s === "needs-improvement"
      ? "bg-yellow-500"
      : "bg-red-500";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

function statusLabel(s: Status) {
  if (s === "good") return <span className="text-green-600">Good</span>;
  if (s === "needs-improvement")
    return <span className="text-yellow-600">Needs improvement</span>;
  return <span className="text-red-600">Poor</span>;
}

// ── Skeleton helpers ──────────────────────────────────────────────────────

function ScoreSkeleton() {
  return (
    <div className="border border-foreground/10 p-6 flex flex-col gap-3">
      <div className="w-28 h-3 animate-pulse bg-foreground/10" />
      <div className="w-16 h-12 animate-pulse bg-foreground/10" />
      <div className="w-20 h-3 animate-pulse bg-foreground/10" />
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="border border-foreground/10 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse bg-foreground/10" />
        <div className="w-8 h-3 animate-pulse bg-foreground/10" />
      </div>
      <div className="w-20 h-8 animate-pulse bg-foreground/10" />
      <div className="w-32 h-3 animate-pulse bg-foreground/10" />
      <div className="w-16 h-3 animate-pulse bg-foreground/10" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="border border-foreground/10 p-4">
      <div className="w-40 h-3 animate-pulse bg-foreground/10 mb-6" />
      <div className="flex items-end gap-1 h-28">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse bg-foreground/10"
            style={{ height: `${30 + ((i * 17) % 70)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  abbr: string;
  value: number | null;
  unit: string;
  desc: string;
  good: string;
  getStatus: (v: number) => Status;
}

function MetricCard({ label, abbr, value, unit, desc, good, getStatus }: MetricCardProps) {
  const status = value !== null ? getStatus(value) : null;

  return (
    <div className="border border-foreground/10 p-4 hover:border-foreground/20 transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        {status ? statusDot(status) : <span className="w-2 h-2 rounded-full bg-foreground/10 shrink-0" />}
        <span className="text-xs font-mono font-medium text-blue-500">{abbr}</span>
      </div>

      {value !== null ? (
        <p className="text-3xl font-display mb-1">
          {abbr === "CLS" ? value.toFixed(3) : value.toFixed(2)}
          <span className="text-sm font-mono text-muted-foreground ml-1">{unit}</span>
        </p>
      ) : (
        <p className="text-3xl font-display text-muted-foreground/30 mb-1">—</p>
      )}

      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className="text-xs text-muted-foreground/60">{desc}</p>

      <div className="mt-3 pt-3 border-t border-foreground/10 flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">Good: {good}</span>
        {status && (
          <span className="text-xs font-mono">{statusLabel(status)}</span>
        )}
      </div>
    </div>
  );
}

// ── LCP time-series chart ─────────────────────────────────────────────────

function LcpChart({ data }: { data: TimeSeriesPoint[] }) {
  const maxLcp = Math.max(...data.map((d) => d.lcp), 0.1);

  return (
    <div className="border border-foreground/10 p-4">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
        LCP trend — last 14 days
      </p>
      <div className="flex items-end gap-1 h-28">
        {data.map((point) => {
          const pct = Math.round((point.lcp / maxLcp) * 100);
          const s = lcpStatus(point.lcp);
          const barColor =
            s === "good"
              ? "bg-green-500/40 group-hover:bg-green-500/70"
              : s === "needs-improvement"
              ? "bg-yellow-500/40 group-hover:bg-yellow-500/70"
              : "bg-red-500/40 group-hover:bg-red-500/70";
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center group"
              title={`${point.date}: LCP ${point.lcp}s`}
            >
              <div
                className={`w-full transition-colors duration-300 ${barColor}`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      {data.length > 0 && (
        <div className="flex justify-between mt-2">
          <span className="text-xs font-mono text-muted-foreground">{data[0].date}</span>
          <span className="text-xs font-mono text-muted-foreground">
            {data[data.length - 1].date}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function SpeedInsightsPage() {
  const [data, setData] = useState<SpeedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/speed-insights")
      .then((r) => r.json())
      .then((d: SpeedData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const metrics: MetricCardProps[] = [
    {
      label: "Largest Contentful Paint",
      abbr: "LCP",
      value: data?.lcp ?? null,
      unit: "s",
      desc: "Time until the largest content element is visible",
      good: "< 2.5s",
      getStatus: lcpStatus,
    },
    {
      label: "First Input Delay",
      abbr: "FID",
      value: data?.fid ?? null,
      unit: "ms",
      desc: "Time from first interaction to browser response",
      good: "< 100ms",
      getStatus: fidStatus,
    },
    {
      label: "Cumulative Layout Shift",
      abbr: "CLS",
      value: data?.cls ?? null,
      unit: "",
      desc: "Visual stability — unexpected layout shifts",
      good: "< 0.1",
      getStatus: clsStatus,
    },
    {
      label: "First Contentful Paint",
      abbr: "FCP",
      value: data?.fcp ?? null,
      unit: "s",
      desc: "Time until first content is painted on screen",
      good: "< 1.8s",
      getStatus: fcpStatus,
    },
    {
      label: "Time to First Byte",
      abbr: "TTFB",
      value: data?.ttfb ?? null,
      unit: "s",
      desc: "Server response time to the first byte",
      good: "< 0.8s",
      getStatus: ttfbStatus,
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium">Speed Insights</h1>
          {!loading && data && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">live</span>
            </span>
          )}
        </div>
        <Zap className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 px-6 py-6 space-y-6 max-w-4xl">
        {/* Mock data / connect Vercel notice */}
        {!loading && data?.mock && (
          <div className="flex items-start gap-3 border border-foreground/10 px-4 py-3 bg-foreground/[0.02]">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect Vercel to see real Speed Insights data — add{" "}
              <span className="font-mono">VERCEL_ACCESS_TOKEN</span> and{" "}
              <span className="font-mono">VERCEL_TEAM_ID</span> to your environment
              variables.
            </p>
          </div>
        )}

        {/* Performance score */}
        {loading ? (
          <ScoreSkeleton />
        ) : data ? (
          <div className="border border-foreground/10 p-6">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Performance Score
            </p>
            {data.score !== null ? (
              <>
                <p className="text-5xl font-display mb-2">{data.score}</p>
                <p className="text-xs text-muted-foreground">
                  {data.score >= 90
                    ? "Excellent — your site loads fast for real users."
                    : data.score >= 50
                    ? "Needs improvement — some metrics are outside the good range."
                    : "Poor — significant performance issues detected."}
                </p>
              </>
            ) : (
              <p className="text-5xl font-display text-muted-foreground/30">—</p>
            )}
          </div>
        ) : null}

        {/* Core Web Vitals metric cards */}
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Core Web Vitals
          </p>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((m) => (
                <MetricCard key={m.abbr} {...m} />
              ))}
            </div>
          )}
        </div>

        {/* LCP trend chart */}
        {loading ? (
          <ChartSkeleton />
        ) : data?.timeSeries && data.timeSeries.length > 0 ? (
          <LcpChart data={data.timeSeries} />
        ) : null}

        {/* Reference table */}
        {!loading && (
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
              Thresholds Reference
            </p>
            <div className="border border-foreground/10">
              {[
                { key: "LCP", good: "≤ 2.5s", ni: "≤ 4.0s", poor: "> 4.0s" },
                { key: "FID", good: "≤ 100ms", ni: "≤ 300ms", poor: "> 300ms" },
                { key: "CLS", good: "≤ 0.1", ni: "≤ 0.25", poor: "> 0.25" },
                { key: "FCP", good: "≤ 1.8s", ni: "≤ 3.0s", poor: "> 3.0s" },
                { key: "TTFB", good: "≤ 0.8s", ni: "≤ 1.8s", poor: "> 1.8s" },
              ].map((row, i, arr) => (
                <div
                  key={row.key}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                    i < arr.length - 1 ? "border-b border-foreground/10" : ""
                  }`}
                >
                  <span className="text-xs font-mono font-medium w-10 shrink-0 text-blue-500">
                    {row.key}
                  </span>
                  <div className="flex-1 flex items-center gap-6">
                    <span className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      {row.good}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                      {row.ni}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      {row.poor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
