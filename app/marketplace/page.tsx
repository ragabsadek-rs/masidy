"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderLogo } from "@/components/marketplace/provider-logo";
import { marketplaceIntegrations, getIntegrationCategories, getProviders } from "@/lib/integrations";

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [installedSlugs, setInstalledSlugs] = useState<string[]>([]);

  const providers = useMemo(() => getProviders(), []);
  const categories = useMemo(() => ["All", ...getIntegrationCategories()], []);

  useEffect(() => {
    const abort = new AbortController();

    fetch("/api/marketplace/installed", { signal: abort.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setInstalledSlugs(data.map((item) => item.slug));
      })
      .catch(() => {});

    return () => abort.abort();
  }, []);

  const filteredIntegrations = useMemo(() => {
    return marketplaceIntegrations.filter((integration) => {
      const matchesCategory = category === "All" || integration.category === category;
      const matchesProvider = selectedProvider === "All" || integration.provider === selectedProvider;
      const matchesQuery = [integration.name, integration.description, integration.provider]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesCategory && matchesProvider && matchesQuery;
    });
  }, [category, query, selectedProvider]);

  return (
    <main className="relative min-h-screen bg-background py-12 px-6 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <section className="mb-16 rounded-3xl border border-foreground/10 bg-card/80 p-10 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Marketplace</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Discover integrations built for Masidy.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                Browse extensions, providers, and tools that connect directly with your Masidy workspace.
                Install, configure, and manage everything from one platform.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg" className="w-full justify-center">
                <Link href="/dashboard/integrations">View installed integrations</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="w-full justify-center">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-foreground/10 bg-card/80 p-6 shadow-sm shadow-black/5 backdrop-blur-xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trusted providers</p>
                <p className="mt-2 text-sm text-foreground/80">
                  Import provider integrations just like Vercel's marketplace.
                </p>
              </div>
              <div className="rounded-full border border-foreground/10 bg-background px-4 py-2 text-sm text-muted-foreground">
                {providers.length} providers
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {providers.map((provider) => {
                const isActive = provider.name === selectedProvider;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.name)}
                    className={`group flex items-center gap-4 rounded-3xl border p-5 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-foreground/10 bg-background text-muted-foreground hover:border-foreground/40"
                    }`}
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background">
                      <ProviderLogo provider={provider.name} className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{provider.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-3xl border border-foreground/10 bg-card/80 p-6 shadow-sm shadow-black/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              <Search className="h-4 w-4" />
              Search integrations
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-foreground/10 bg-background p-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, provider, or category"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">Categories</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                      category === item
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-foreground/10 bg-background text-foreground/80 hover:border-foreground/40"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-foreground/10 bg-card/80 p-6 shadow-sm shadow-black/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Featured
            </div>
            <div className="mt-6 grid gap-4">
              {marketplaceIntegrations
                .filter((integration) => integration.status === "Featured")
                .map((integration) => (
                  <Link
                    key={integration.id}
                    href={`/dashboard/integrations/${integration.slug}`}
                    className="rounded-3xl border border-foreground/10 bg-background p-5 transition hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ProviderLogo provider={integration.provider} className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{integration.provider}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                        {integration.category}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{integration.description}</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">All integrations</h2>
              <p className="text-sm text-muted-foreground">Browse available Masidy integrations by provider and capability.</p>
            </div>
            <div className="rounded-full border border-foreground/10 bg-background px-4 py-2 text-sm text-muted-foreground">
              {filteredIntegrations.length} results
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <Link
                key={integration.id}
                href={`/dashboard/integrations/${integration.slug}`}
                className="group rounded-3xl border border-foreground/10 bg-card/80 p-6 shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-background"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ProviderLogo provider={integration.provider} className="h-5 w-5" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">{integration.name}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{integration.tagline}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {installedSlugs.includes(integration.slug) && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Installed
                      </span>
                    )}
                    <span className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {integration.category}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">{integration.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {integration.highlights.map((highlight) => (
                    <span key={highlight} className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs text-muted-foreground">
                      {highlight}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
