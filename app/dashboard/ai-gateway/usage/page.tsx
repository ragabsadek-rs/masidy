"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface DayBucket {
  date: string; // "YYYY-MM-DD"
  credits: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AIGatewayUsagePage() {
  const [buckets, setBuckets] = useState<DayBucket[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Last 14 days window
      const now = new Date();
      const since = new Date(now);
      since.setDate(since.getDate() - 13);
      since.setHours(0, 0, 0, 0);

      // First day of current month for monthly total
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data } = await supabase
        .from("credit_transactions")
        .select("amount, created_at")
        .eq("user_id", user.id)
        .lt("amount", 0) // usage only
        .gte("created_at", monthStart.toISOString());

      if (data) {
        // Monthly total
        const total = data.reduce((s, r) => s + Math.abs(r.amount), 0);
        setMonthTotal(total);

        // Build 14-day buckets
        const map = new Map<string, number>();
        // Pre-fill all 14 days with 0
        for (let i = 0; i < 14; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().slice(0, 10);
          map.set(key, 0);
        }
        // Accumulate
        for (const row of data) {
          const key = row.created_at.slice(0, 10);
          if (map.has(key)) {
            map.set(key, (map.get(key) ?? 0) + Math.abs(row.amount));
          }
        }
        const sorted = Array.from(map.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, credits]) => ({ date, credits }));
        setBuckets(sorted);
      }

      setLoading(false);
    }
    load();
  }, []);

  const maxCredits = Math.max(...buckets.map((b) => b.credits), 1);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-medium">Usage</h1>
        </div>
        <span className="text-xs font-mono text-muted-foreground">last 14 days</span>
      </div>

      <div className="flex-1 px-6 py-6 max-w-4xl">
        {/* Monthly total stat */}
        <div className="border border-foreground/10 p-4 mb-8 inline-block min-w-[180px]">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
            This Month
          </p>
          {loading ? (
            <div className="animate-pulse bg-foreground/10 h-8 w-24 rounded-none" />
          ) : (
            <>
              <p className="text-3xl font-display">{monthTotal.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">credits used</p>
            </>
          )}
        </div>

        {/* Chart section */}
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
          Daily Credit Usage
        </p>

        {loading ? (
          /* Skeleton chart */
          <div className="border border-foreground/10 p-6">
            <div className="flex items-end gap-2 h-40">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full animate-pulse bg-foreground/10 rounded-none"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              {[...Array(14)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 animate-pulse bg-foreground/10 h-2 rounded-none"
                />
              ))}
            </div>
          </div>
        ) : buckets.every((b) => b.credits === 0) ? (
          <div className="border border-foreground/10 px-4 py-12 text-center">
            <BarChart2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No usage in the last 14 days</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              AI calls will appear here as daily bars.
            </p>
          </div>
        ) : (
          <div className="border border-foreground/10 p-6">
            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-40">
              {buckets.map((bucket) => {
                const heightPct =
                  maxCredits > 0 ? (bucket.credits / maxCredits) * 100 : 0;
                return (
                  <div
                    key={bucket.date}
                    className="flex-1 flex flex-col items-center justify-end gap-0 group relative"
                    title={`${formatDate(bucket.date)}: ${bucket.credits.toFixed(2)} credits`}
                  >
                    {/* Tooltip on hover */}
                    {bucket.credits > 0 && (
                      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                        <div className="bg-foreground text-background text-[10px] font-mono px-2 py-1 whitespace-nowrap">
                          {bucket.credits.toFixed(2)}
                        </div>
                      </div>
                    )}
                    <div
                      className="w-full bg-foreground/80 hover:bg-foreground transition-colors duration-150"
                      style={{
                        height: heightPct > 0 ? `${Math.max(heightPct, 2)}%` : "2px",
                        opacity: heightPct > 0 ? 1 : 0.15,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis labels — show every other label to avoid crowding */}
            <div className="flex gap-1.5 mt-2">
              {buckets.map((bucket, i) => (
                <div key={bucket.date} className="flex-1 text-center">
                  {i % 2 === 0 ? (
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {formatDate(bucket.date)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Y-axis legend */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-foreground/10">
              <span className="text-[10px] font-mono text-muted-foreground">0</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {(maxCredits / 2).toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {maxCredits.toFixed(1)} cr
              </span>
            </div>
          </div>
        )}

        {/* Data table below chart */}
        {!loading && buckets.some((b) => b.credits > 0) && (
          <div className="mt-8">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
              Daily Breakdown
            </p>
            <div className="border border-foreground/10">
              <div className="grid grid-cols-[1fr_160px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
                {["Date", "Credits Used"].map((h) => (
                  <span
                    key={h}
                    className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {[...buckets].reverse().map((bucket, i) => (
                <div
                  key={bucket.date}
                  className={`grid grid-cols-[1fr_160px] items-center px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                    i < buckets.length - 1 ? "border-b border-foreground/10" : ""
                  }`}
                >
                  <span className="text-sm font-mono">{formatDate(bucket.date)}</span>
                  <span
                    className={`text-sm font-mono ${
                      bucket.credits > 0 ? "text-foreground" : "text-muted-foreground/40"
                    }`}
                  >
                    {bucket.credits > 0 ? bucket.credits.toFixed(2) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
