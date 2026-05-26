"use client";

import { ArrowRight, Check } from "lucide-react";

const creditPacks = [
  {
    id: "pack_5",
    price: 5,
    credits: 50,
    perCredit: "0.10",
    popular: false,
  },
  {
    id: "pack_10",
    price: 10,
    credits: 110,
    perCredit: "0.09",
    popular: false,
  },
  {
    id: "pack_20",
    price: 20,
    credits: 240,
    perCredit: "0.08",
    popular: true,
  },
  {
    id: "pack_50",
    price: 50,
    credits: 650,
    perCredit: "0.08",
    popular: false,
  },
  {
    id: "pack_100",
    price: 100,
    credits: 1400,
    perCredit: "0.07",
    popular: false,
  },
];

const creditCosts = [
  { action: "Masidy Lite message", cost: "0.5 cr" },
  { action: "Masidy Standard message", cost: "2 cr" },
  { action: "Masidy Max message", cost: "5 cr" },
  { action: "Deploy to Vercel", cost: "1 cr" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-32 lg:py-40 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">
            Pricing
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            Buy credits.
            <br />
            <span className="text-stroke">Build anything.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            No subscriptions. No monthly fees. Credits never expire — use them at your own pace.
          </p>
        </div>

        {/* Credit Packs */}
        <div className="grid md:grid-cols-5 gap-px bg-foreground/10 mb-16">
          {creditPacks.map((pack, idx) => (
            <div
              key={pack.id}
              className={`relative p-8 bg-background ${
                pack.popular ? "md:-my-4 md:py-12 border-2 border-foreground" : ""
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              {/* Pack header */}
              <div className="mb-6">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="font-display text-4xl text-foreground mt-2">${pack.price}</div>
                <div className="font-display text-2xl text-foreground mt-1">
                  {pack.credits.toLocaleString()} <span className="text-muted-foreground text-lg">credits</span>
                </div>
              </div>

              {/* Per-credit cost */}
              <div className="mb-6 pb-6 border-b border-foreground/10">
                <span className="font-mono text-xs text-muted-foreground">
                  ${pack.perCredit} / credit
                </span>
              </div>

              {/* Perks */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">Never expire</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">All models included</span>
                </li>
              </ul>

              {/* CTA */}
              <a
                href="/auth/signup"
                className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 group ${
                  pack.popular
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                Get started
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          ))}
        </div>

        {/* Credit costs reference */}
        <div className="border border-foreground/10 p-8 lg:p-12">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-8">
            Credit costs reference
          </span>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10">
            {creditCosts.map((item) => (
              <div key={item.action} className="bg-background p-6">
                <div className="font-display text-2xl text-foreground mb-2">{item.cost}</div>
                <div className="text-sm text-muted-foreground">{item.action}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            New accounts start with 10 free credits — no card required.{" "}
            <a href="/auth/signup" className="underline underline-offset-4 hover:text-foreground transition-colors duration-300">
              Sign up free
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
