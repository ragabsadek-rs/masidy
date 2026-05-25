"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

function SkeletonBlock({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} bg-foreground/10 animate-pulse`} />;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const userEmail = data.user.email ?? "";
        const name =
          data.user.user_metadata?.display_name ??
          data.user.user_metadata?.full_name ??
          userEmail.split("@")[0] ??
          "";
        setEmail(userEmail);
        setDisplayName(name);
        setInitial(name.charAt(0).toUpperCase() || "?");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    setSaving(false);

    if (error) {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Update the displayed initial after save
      setInitial(displayName.trim().charAt(0).toUpperCase() || "?");
      toast({
        title: "Profile updated",
        description: "Your display name has been saved.",
      });
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">profile</span>
        </div>
        <span className="text-sm font-medium absolute left-1/2 -translate-x-1/2">Profile</span>
        <div />
      </div>

      <div className="flex-1 px-6 py-8 max-w-[640px] w-full mx-auto">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">
          <span className="w-8 h-px bg-foreground/30" />
          Account
        </span>

        <h1 className="text-3xl font-display tracking-tight mb-1">Profile</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Manage your display name and account details.
        </p>

        {/* Avatar */}
        <div className="border border-foreground/10 p-6 mb-6">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">Avatar</p>
          <div className="flex items-center gap-5">
            {loading ? (
              <div className="w-16 h-16 bg-foreground/10 animate-pulse shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-foreground flex items-center justify-center shrink-0">
                <span className="text-background text-2xl font-mono font-medium">{initial}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-1">
                {loading ? <SkeletonBlock h="h-4" w="w-32" /> : displayName || email}
              </p>
              <p className="text-xs text-muted-foreground">
                Initials avatar — generated from your display name.
              </p>
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="border border-foreground/10 p-6 flex flex-col gap-6">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Details</p>

          {/* Display name */}
          <div>
            <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase block mb-2">
              Display name
            </label>
            {loading ? (
              <SkeletonBlock h="h-10" />
            ) : (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/40 font-sans"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              Shown in the sidebar and across the dashboard.
            </p>
          </div>

          {/* Email — read-only */}
          <div>
            <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase block mb-2">
              Email address
            </label>
            {loading ? (
              <SkeletonBlock h="h-10" />
            ) : (
              <input
                type="email"
                value={email}
                disabled
                className="w-full h-10 px-3 text-sm border border-foreground/10 bg-foreground/[0.02] text-muted-foreground outline-none cursor-not-allowed font-sans"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-foreground/10" />

          {/* Save button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Changes are saved to your Supabase account metadata.
            </p>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-foreground text-background rounded-full px-8 h-12 text-sm hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-40 flex items-center gap-2 group shrink-0"
            >
              {saving ? (
                <span className="font-sans">Saving…</span>
              ) : (
                <>
                  Save changes
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
