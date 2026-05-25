"use client";

import { useState, useEffect } from "react";
import { CREDIT_PACKS } from "@/lib/stripe";
import { Zap, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setBalanceLoading(true);
    fetch("/api/credits/balance")
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.balance);
        setBalanceLoading(false);
      })
      .catch(() => setBalanceLoading(false));

    // Show success/cancel toast from Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      const credits = params.get("credits");
      toast({ title: "Credits added", description: `${credits} credits have been added to your account.` });
      window.history.replaceState({}, "", "/dashboard/billing");
    }
    if (params.get("cancelled")) {
      toast({ title: "Payment cancelled", description: "Your payment was not completed.", variant: "destructive" });
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, []);

  async function buyPack(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        toast({ title: "Checkout failed", description: "Could not start checkout. Please try again.", variant: "destructive" });
        setLoading(null);
      }
    } catch {
      toast({ title: "Checkout failed", description: "An unexpected error occurred.", variant: "destructive" });
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Toaster />
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-foreground/10 shrink-0">
        <span className="text-sm font-medium">Billing &amp; Credits</span>
        {balanceLoading ? (
          <div className="h-4 w-32 animate-pulse bg-foreground/10" />
        ) : balance !== null && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium">{balance}</span>
            <span className="text-muted-foreground">credits remaining</span>
          </div>
        )}
      </div>

      <div className="flex-1 px-6 py-8 max-w-3xl">
        {/* Credit packs */}
        <div className="mb-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Credits</p>
          <h2 className="text-2xl font-display tracking-tight mb-1">Buy credits</h2>
          <p className="text-sm text-muted-foreground mb-6">Pay only for what you use. Credits never expire.</p>
        </div>

        {balanceLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-foreground/10 p-5 flex flex-col gap-3">
                <div className="h-7 w-20 animate-pulse bg-foreground/10" />
                <div className="h-4 w-28 animate-pulse bg-foreground/10" />
                <div className="h-3 w-24 animate-pulse bg-foreground/10" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-full animate-pulse bg-foreground/10" />
                  <div className="h-3 w-full animate-pulse bg-foreground/10" />
                </div>
                <div className="h-9 w-full animate-pulse bg-foreground/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CREDIT_PACKS.map((pack) => {
              const perCredit = (pack.price / 100 / pack.credits).toFixed(3);
              const popular = pack.id === "pack_20";
              return (
                <div key={pack.id}
                  className={`border p-5 flex flex-col gap-3 transition-colors duration-150 ${popular ? "border-foreground" : "border-foreground/10 hover:border-foreground/25"}`}>
                  {popular && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-foreground bg-foreground/8 px-2 py-0.5 w-fit">
                      Most popular
                    </span>
                  )}
                  <div>
                    <p className="text-2xl font-display">{pack.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className="text-foreground font-medium">{pack.credits}</span> credits
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">${perCredit} per credit</p>
                  </div>
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />Never expire</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" />All models included</li>
                  </ul>
                  <button onClick={() => buyPack(pack.id)} disabled={loading === pack.id}
                    className={`w-full h-9 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 ${
                      popular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border border-foreground/15 hover:bg-foreground/5"
                    }`}>
                    {loading === pack.id ? (
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-current animate-bounce"
                            style={{ animationDelay: `${i * 100}ms` }} />
                        ))}
                      </span>
                    ) : `Buy ${pack.label}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Credit costs reference */}
        <div className="mt-10">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Credit costs</p>
          <div className="border border-foreground/10">
            {[
              { action: "Masidy Lite message",     cost: "0.5 credits" },
              { action: "Masidy Standard message", cost: "2 credits"   },
              { action: "Masidy Max message",      cost: "5 credits"   },
              { action: "Deploy project",          cost: "1 credit"    },
              { action: "Custom domain",           cost: "2 credits"   },
              { action: "Storage (per GB/mo)",     cost: "3 credits"   },
            ].map((row, i, arr) => (
              <div key={row.action}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${i < arr.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <span className="text-muted-foreground">{row.action}</span>
                <span className="font-mono text-xs">{row.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
