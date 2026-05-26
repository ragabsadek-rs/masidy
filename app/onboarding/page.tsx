"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Key, Layout, Loader2, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const TEMPLATES = [
  {
    id: "blank",
    label: "Blank",
    description: "Start from scratch with a minimal Next.js app.",
    icon: Layout,
  },
  {
    id: "landing",
    label: "Landing Page",
    description: "A polished marketing page with hero, features, and CTA.",
    icon: Zap,
  },
  {
    id: "saas",
    label: "SaaS Dashboard",
    description: "Auth, sidebar, and data tables — ready to wire up.",
    icon: Layout,
  },
  {
    id: "api",
    label: "API Service",
    description: "Next.js API routes with typed handlers and middleware.",
    icon: Key,
  },
];

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          display_name: displayName.trim() || undefined,
          vercel_token: vercelToken.trim() || undefined,
          starter_template: selectedTemplate,
        },
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      // Create a project from the selected template
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: selectedTemplate }),
        });
        const data = await res.json();
        if (data?.id) {
          router.push(`/builder?projectId=${data.id}`);
          return;
        }
      } catch {
        // Fall back to dashboard if project creation fails
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }

  const canAdvance =
    step === 1
      ? true // name is optional
      : step === 2
      ? true // token is optional
      : true; // template always has a default

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Subtle grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-foreground/10"
            style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-foreground/10"
            style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-2xl font-display tracking-tight">masidy</span>
          <span className="text-2xl font-display text-blue-500">.</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="transition-all duration-300"
              style={{
                width: step === i + 1 ? "24px" : "8px",
                height: "8px",
                borderRadius: "9999px",
                backgroundColor:
                  i + 1 <= step
                    ? "var(--foreground)"
                    : "color-mix(in srgb, var(--foreground) 20%, transparent)",
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="border border-foreground/10 bg-background p-8">
          {/* Step 1 — Name & project setup */}
          {step === 1 && (
            <div>
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Step 1 of {TOTAL_STEPS}
              </span>
              <h1 className="text-3xl font-display tracking-tight mt-3 mb-2">
                Welcome to Masidy
              </h1>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Let&apos;s get you set up. Tell us what to call you — you can always change this later.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase block mb-2">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex"
                    autoFocus
                    className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Vercel token */}
          {step === 2 && (
            <div>
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Step 2 of {TOTAL_STEPS}
              </span>
              <h1 className="text-3xl font-display tracking-tight mt-3 mb-2">
                Connect Vercel
              </h1>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                Masidy deploys your projects directly to Vercel. Paste your Vercel API token below so we can deploy on your behalf.
              </p>
              <p className="text-xs text-muted-foreground mb-8 leading-relaxed">
                Get one at{" "}
                <a
                  href="https://vercel.com/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  vercel.com/account/tokens
                </a>
                . Your token is stored encrypted in your account and never shared.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase block mb-2">
                    Vercel API token
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="password"
                      value={vercelToken}
                      onChange={(e) => setVercelToken(e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                      autoFocus
                      className="w-full h-10 pl-9 pr-3 text-sm font-mono border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-foreground/[0.02] border border-foreground/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You can skip this step and add your token later from the dashboard settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Starter template */}
          {step === 3 && (
            <div>
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Step 3 of {TOTAL_STEPS}
              </span>
              <h1 className="text-3xl font-display tracking-tight mt-3 mb-2">
                Choose a starter
              </h1>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Pick a template for your first project. You can always start fresh or switch later.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  const active = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`text-left p-4 border transition-all duration-150 ${
                        active
                          ? "border-foreground bg-foreground/[0.03]"
                          : "border-foreground/10 hover:border-foreground/25 hover:bg-foreground/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{tpl.label}</span>
                        {active && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tpl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive mt-4">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={loading}
                className="border border-foreground/20 rounded-full h-10 px-6 text-sm hover:bg-foreground/5 transition-colors duration-150 disabled:opacity-40"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={!canAdvance || loading}
              className="bg-foreground text-background rounded-full px-8 h-12 text-sm hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-40 flex items-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === TOTAL_STEPS ? (
                <>
                  Get started
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip link */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Already set up?{" "}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Go to dashboard
          </button>
        </p>
      </div>
    </div>
  );
}
