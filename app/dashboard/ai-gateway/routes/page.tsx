"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Route, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

interface RouteRow {
  action: string;
  total_credits: number;
  call_count: number;
}

export default function AIGatewayRoutesPage() {
  const [rows, setRows] = useState<RouteRow[]>([]);
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

      const { data } = await supabase
        .from("credit_transactions")
        .select("action, amount")
        .eq("user_id", user.id)
        .lt("amount", 0); // only debit rows (usage)

      if (data) {
        // Group by action client-side
        const map = new Map<string, { total_credits: number; call_count: number }>();
        for (const row of data) {
          const key = row.action ?? "unknown";
          const existing = map.get(key) ?? { total_credits: 0, call_count: 0 };
          map.set(key, {
            total_credits: existing.total_credits + Math.abs(row.amount),
            call_count: existing.call_count + 1,
          });
        }
        const sorted = Array.from(map.entries())
          .map(([action, stats]) => ({ action, ...stats }))
          .sort((a, b) => b.total_credits - a.total_credits);
        setRows(sorted);
      }

      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-medium">Routes</h1>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          credit usage per model / action
        </span>
      </div>

      <div className="flex-1 px-6 py-6 max-w-4xl">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
          Usage by Route
        </p>

        {loading ? (
          /* Skeleton */
          <div className="border border-foreground/10">
            {/* Header row skeleton */}
            <div className="grid grid-cols-[1fr_140px_120px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
              {["Route / Action", "Credits Used", "Calls"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
                >
                  {h}
                </span>
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_140px_120px] items-center px-4 py-3 border-b border-foreground/10 last:border-b-0"
              >
                <div className="animate-pulse bg-foreground/10 h-3 w-40 rounded-none" />
                <div className="animate-pulse bg-foreground/10 h-3 w-16 rounded-none" />
                <div className="animate-pulse bg-foreground/10 h-3 w-10 rounded-none" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-foreground/10 px-4 py-12 text-center">
            <Zap className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No route usage yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Credits spent on AI calls will appear here grouped by model.
            </p>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_140px_120px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
              {["Route / Action", "Credits Used", "Calls"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
                >
                  {h}
                </span>
              ))}
            </div>

            {rows.map((row, i) => (
              <div
                key={row.action}
                className={`grid grid-cols-[1fr_140px_120px] items-center px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                  i < rows.length - 1 ? "border-b border-foreground/10" : ""
                }`}
              >
                <span className="text-sm font-mono truncate">{row.action}</span>
                <span className="text-sm font-mono font-display">
                  {row.total_credits.toFixed(2)}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  {row.call_count.toLocaleString()}
                </span>
              </div>
            ))}

            {/* Totals footer */}
            <div className="grid grid-cols-[1fr_140px_120px] items-center px-4 py-3 border-t border-foreground/20 bg-foreground/[0.02]">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Total
              </span>
              <span className="text-sm font-mono font-display">
                {rows.reduce((s, r) => s + r.total_credits, 0).toFixed(2)}
              </span>
              <span className="text-sm font-mono text-muted-foreground">
                {rows.reduce((s, r) => s + r.call_count, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
