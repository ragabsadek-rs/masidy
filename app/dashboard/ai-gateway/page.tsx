"use client";

import { useEffect, useState } from "react";
import { Zap, BarChart2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AIGatewayPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<{ action: string; amount: number; description: string; created_at: string }[]>([]);

  useEffect(() => {
    fetch("/api/credits/balance").then(r => r.json()).then(d => setCredits(d.balance)).catch(() => {});
    fetch("/api/credits/transactions").then(r => r.json()).then(d => setTransactions(Array.isArray(d) ? d.slice(0, 20) : [])).catch(() => {});
  }, []);

  const totalUsed = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalPurchased = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">AI Gateway</h1>
        <Link href="/dashboard/billing"
          className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
          <Zap className="w-3 h-3" />Buy Credits
        </Link>
      </div>
      <div className="flex-1 px-6 py-6 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-foreground/10 p-4">
            <p className="text-xs text-muted-foreground mb-2">Current Balance</p>
            <p className="text-3xl font-display">{credits ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">credits</p>
          </div>
          <div className="border border-foreground/10 p-4">
            <p className="text-xs text-muted-foreground mb-2">Total Used</p>
            <p className="text-3xl font-display">{totalUsed.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">credits</p>
          </div>
          <div className="border border-foreground/10 p-4">
            <p className="text-xs text-muted-foreground mb-2">Total Purchased</p>
            <p className="text-3xl font-display">{totalPurchased}</p>
            <p className="text-xs text-muted-foreground mt-1">credits</p>
          </div>
        </div>

        {/* Usage log */}
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Usage History</p>
        {transactions.length === 0 ? (
          <div className="border border-foreground/10 px-4 py-8 text-center">
            <BarChart2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No usage yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start building to see your AI usage here.</p>
          </div>
        ) : (
          <div className="border border-foreground/10">
            <div className="grid grid-cols-[1fr_80px_200px_100px] px-4 py-2 border-b border-foreground/10 bg-foreground/[0.02]">
              {["Description", "Credits", "Action", "Date"].map(h => (
                <span key={h} className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{h}</span>
              ))}
            </div>
            {transactions.map((t, i) => (
              <div key={i} className={`grid grid-cols-[1fr_80px_200px_100px] items-center px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < transactions.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <span className="text-sm truncate">{t.description}</span>
                <span className={`text-sm font-mono ${t.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{t.action}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
