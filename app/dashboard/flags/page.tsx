"use client";

import { useEffect, useState } from "react";
import { Flag, Plus, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
}

export default function FlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const { toast } = useToast();

  function fetchFlags() {
    setLoading(true);
    fetch("/api/flags")
      .then((r) => r.json())
      .then((d) => {
        setFlags(d?.flags ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchFlags();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast({ title: "Flag name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to create flag",
          description: data?.error ?? "An error occurred",
          variant: "destructive",
        });
      } else {
        toast({ title: "Feature flag created" });
        setShowForm(false);
        setFormName("");
        setFormDescription("");
        fetchFlags();
      }
    } catch {
      toast({ title: "Failed to create flag", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(flag: FeatureFlag) {
    setTogglingId(flag.id);
    try {
      const res = await fetch(`/api/flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to update flag",
          description: data?.error ?? "An error occurred",
          variant: "destructive",
        });
      } else {
        toast({
          title: !flag.enabled
            ? `"${flag.name}" enabled`
            : `"${flag.name}" disabled`,
        });
        fetchFlags();
      }
    } catch {
      toast({ title: "Failed to update flag", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(flag: FeatureFlag) {
    setDeletingId(flag.id);
    try {
      const res = await fetch(`/api/flags/${flag.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to delete flag",
          description: data?.error ?? "An error occurred",
          variant: "destructive",
        });
      } else {
        toast({ title: `"${flag.name}" deleted` });
        fetchFlags();
      }
    } catch {
      toast({ title: "Failed to delete flag", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Feature Flags</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300"
        >
          {showForm ? (
            <>
              <X className="w-3.5 h-3.5" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Create Flag
            </>
          )}
        </button>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {/* Create flag form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="border border-foreground/10 bg-foreground/[0.02] p-5 mb-6"
          >
            <p className="text-sm font-medium mb-4">New Feature Flag</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. new-checkout-flow"
                  className="h-9 px-3 text-sm font-mono bg-background border border-foreground/10 focus:border-foreground/30 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Description{" "}
                  <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What does this flag control?"
                  className="h-9 px-3 text-sm bg-background border border-foreground/10 focus:border-foreground/30 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-6 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Flag"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Flags list */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-foreground/10" />
            ))}
          </div>
        ) : (
          <div className="border border-foreground/10">
            <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Flags ({flags.length})
              </span>
            </div>

            {flags.length === 0 ? (
              <div className="px-4 py-16 flex flex-col items-center gap-4 text-center">
                <Flag className="w-8 h-8 text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-medium mb-1">No feature flags yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Use feature flags to safely roll out new features to specific
                    users or percentages of traffic.
                  </p>
                </div>
              </div>
            ) : (
              flags.map((flag, i) => (
                <div
                  key={flag.id}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                    i < flags.length - 1 ? "border-b border-foreground/10" : ""
                  }`}
                >
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(flag)}
                    disabled={togglingId === flag.id}
                    aria-label={flag.enabled ? "Disable flag" : "Enable flag"}
                    className={`relative shrink-0 w-9 h-5 transition-colors duration-300 disabled:opacity-40 ${
                      flag.enabled ? "bg-foreground" : "bg-foreground/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-background transition-transform duration-300 ${
                        flag.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>

                  {/* Flag info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-mono truncate">
                      {flag.name}
                    </p>
                    {flag.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {flag.description}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 shrink-0 ${
                      flag.enabled
                        ? "bg-green-500/10 text-green-600"
                        : "bg-foreground/5 text-muted-foreground"
                    }`}
                  >
                    {flag.enabled ? "enabled" : "disabled"}
                  </span>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={deletingId === flag.id}
                        className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150 disabled:opacity-40"
                        aria-label="Delete flag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background border border-foreground/10 rounded-none shadow-lg max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-medium">
                          Delete feature flag?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                          Are you sure you want to delete{" "}
                          <span className="font-mono text-foreground">
                            {flag.name}
                          </span>
                          ? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 px-5 rounded-full border-foreground/10 text-sm hover:bg-foreground/5">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(flag)}
                          className="h-9 px-5 rounded-full bg-foreground text-background text-sm hover:bg-foreground/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
}
