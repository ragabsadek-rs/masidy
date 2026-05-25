"use client";

import { useEffect, useState } from "react";
import { Eye, Zap, AlertTriangle, Info, Activity } from "lucide-react";
import { timeAgo } from "@/lib/vercel";

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────

interface TimeSeriesPoint {
  date: string;
  edgeRequests: number;
  functionInvocations: number;
}

interface ObservabilityData {
  mock: boolean;
  edgeRequests: number;
  functionInvocations: number;
  errorRate: number;
  timeSeries: TimeSeriesPoint[];
}

interface Deployment {
  uid: string;
  url: string;
  state: string;
  created: number;
}

// ── Skeleton helpers ──────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="border border-foreground/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 animate-pulse bg-foreground/10" />
        <div className="w-32 h-3 animate-pulse bg-foreground/10" />
      </div>
      <div className="w-24 h-8 animate-pulse bg-foreground/10" />
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

function DeploymentsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse bg-foreground/5" />
      ))}
    </div>
  );
}

// ── Time-series chart ─────────────────────────────────────────────────────

function RequestsChart({ data }: { data: TimeSeriesPoint[] }) {
  const maxEdge = Math.max(...data.map((d) => d.edgeRequests), 1);

  return (
    <div className="border border-foreground/10 p-4">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
        Edge Requests — last 14 days
      </p>
      <div className="flex items-end gap-1 h-28">
        {data.map((point) => {
          const pct = Math.round((point.edgeRequests / maxEdge) * 100);
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center group"
              title={`${point.date}: ${point.edgeRequests.toLocaleString()} edge requests, ${point.functionInvocations.toLocaleString()} fn invocations`}
            >
              <div
                className="w-full bg-foreground/20 group-hover:bg-foreground/40 transition-colors duration-300"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
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

export default function ObservabilityPage() {
  const [obsData, setObsData] = useState<ObservabilityData | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploymentsLoading, setDeploymentsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vercel/observability")
      .then((r) => r.json())
      .then((d: ObservabilityData) => {
        setObsData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/vercel/deployments")
      .then((r) => r.json())
      .then((d) => {
        setDeployments(Array.isArray(d) ? d.slice(0, 5) : []);
        setDeploymentsLoading(false);
      })
      .catch(() => setDeploymentsLoading(false));
  }, []);

  const stats = [
    {
      label: "Edge Requests (24h)",
      value: loading ? null : obsData?.edgeRequests ?? 0,
      icon: Eye,
    },
    {
      label: "Function Invocations (24h)",
      value: loading ? null : obsData?.functionInvocations ?? 0,
      icon: Zap,
    },
    {
      label: "Error Rate",
      value: loading ? null : obsData?.errorRate ?? 0,
      icon: AlertTriangle,
      isPercent: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium">Observability</h1>
          {!loading && obsData && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">live</span>
            </span>
          )}
        </div>
        <Activity className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 px-6 py-6 max-w-4xl space-y-6">
        {/* Connect Vercel notice */}
        {!loading && obsData?.mock && (
          <div className="flex items-start gap-3 border border-foreground/10 px-4 py-3 bg-foreground/[0.02]">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect Vercel to see real observability data — add{" "}
              <span className="font-mono">VERCEL_ACCESS_TOKEN</span> and{" "}
              <span className="font-mono">VERCEL_TEAM_ID</span> to your environment
              variables.
            </p>
          </div>
        )}

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="border border-foreground/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-3xl font-display">
                  {stat.value === null
                    ? "—"
                    : stat.isPercent
                    ? `${stat.value}%`
                    : (stat.value as number).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Time-series chart */}
        {loading ? (
          <ChartSkeleton />
        ) : obsData?.timeSeries && obsData.timeSeries.length > 0 ? (
          <RequestsChart data={obsData.timeSeries} />
        ) : null}

        {/* Recent Deployments */}
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Recent Deployments
          </p>
          {deploymentsLoading ? (
            <DeploymentsSkeleton />
          ) : deployments.length > 0 ? (
            <div className="border border-foreground/10">
              {deployments.map((d, i) => (
                <div
                  key={d.uid}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                    i < deployments.length - 1 ? "border-b border-foreground/10" : ""
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      d.state === "READY"
                        ? "bg-green-500"
                        : d.state === "ERROR"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-sm font-mono flex-1 truncate">{d.url}</span>
                  <span className="text-xs font-mono text-muted-foreground capitalize">
                    {d.state?.toLowerCase()}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {timeAgo(d.created)}
                  </span>
                  <a
                    href={`/dashboard/logs?deploymentId=${d.uid}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    Logs →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center border border-foreground/10">
              <Activity className="w-8 h-8 text-muted-foreground/20" />
              <div>
                <p className="text-sm font-medium mb-1">No deployments yet</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Deployments will appear here once you deploy a project.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
