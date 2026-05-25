"use client";

import { useEffect, useState } from "react";
import { HardDrive, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

interface Store {
  id: string;
  name: string;
  type: string;
  region?: string;
}

const STORE_TYPES = [
  { value: "kv", label: "KV (Redis)" },
  { value: "postgres", label: "Postgres" },
  { value: "blob", label: "Blob" },
] as const;

type StoreType = "kv" | "postgres" | "blob";

const typeLabel: Record<string, string> = {
  REDIS: "KV (Redis)",
  KV: "KV (Redis)",
  POSTGRES: "Postgres",
  BLOB: "Blob",
};

export default function StoragePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<StoreType>("kv");
  const { toast } = useToast();

  function fetchStores() {
    setLoading(true);
    fetch("/api/vercel/storage")
      .then((r) => r.json())
      .then((d) => {
        setStores(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchStores();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast({ title: "Store name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/vercel/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: formType, name: formName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to create store",
          description: data?.error ?? "An error occurred",
          variant: "destructive",
        });
      } else {
        toast({ title: "Store created successfully" });
        setShowForm(false);
        setFormName("");
        setFormType("kv");
        fetchStores();
      }
    } catch {
      toast({ title: "Failed to create store", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Storage</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300"
        >
          {showForm ? (
            <><X className="w-3.5 h-3.5" />Cancel</>
          ) : (
            <><Plus className="w-3.5 h-3.5" />Create Store</>
          )}
        </button>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {/* Create store form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="border border-foreground/10 bg-foreground/[0.02] p-5 mb-6"
          >
            <p className="text-sm font-medium mb-4">New Store</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Store Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. my-kv-store"
                  className="h-9 px-3 text-sm font-mono bg-background border border-foreground/10 focus:border-foreground/30 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Type
                </label>
                <div className="flex gap-2">
                  {STORE_TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormType(opt.value)}
                      className={`h-9 px-4 text-sm font-mono transition-colors duration-300 border ${
                        formType === opt.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-foreground/10 hover:border-foreground/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-6 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Store"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Stores list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-foreground/10 animate-pulse" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <HardDrive className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No storage connected</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Connect KV, Postgres, or Blob storage to manage your data here.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {stores.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-4 px-4 py-4 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                  i < stores.length - 1 ? "border-b border-foreground/10" : ""
                }`}
              >
                <HardDrive className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {typeLabel[s.type] ?? s.type}
                    {s.region ? ` · ${s.region}` : ""}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-foreground/5 text-muted-foreground shrink-0">
                  {typeLabel[s.type] ?? s.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
