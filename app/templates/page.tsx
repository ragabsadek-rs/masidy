"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";

export default function TemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUseTemplate(templateId: string) {
    setLoading(templateId);
    try {
      // Check if authenticated
      const authCheck = await fetch("/api/credits/balance");
      if (authCheck.status === 401) {
        router.push(`/auth/signup?template=${templateId}`);
        return;
      }
      // Create project from template
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();
      if (data?.id) {
        router.push(`/builder?projectId=${data.id}`);
      } else {
        router.push(`/auth/signup?template=${templateId}`);
      }
    } catch {
      router.push(`/auth/signup?template=${templateId}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between max-w-[1400px] mx-auto">
        <Link href="/" className="flex items-center gap-0.5">
          <span className="text-xl font-display tracking-tight">masidy</span>
          <span className="text-xl font-display text-blue-500">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">Sign in</Link>
          <Link href="/auth/signup" className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300">
            Get started
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <span className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">
            <span className="w-8 h-px bg-foreground/30" />Templates
          </span>
          <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-4">Start with a template</h1>
          <p className="text-lg text-muted-foreground max-w-xl">Pick a starter and Masidy AI will pre-populate your builder with working code. Customize it with a single message.</p>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map(template => (
            <div key={template.id} className="p-6 border border-foreground/10 hover:border-foreground/20 transition-all duration-300 group flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-mono bg-foreground/[0.02] border border-foreground/10 px-2 py-1">{template.badge}</span>
              </div>
              <h3 className="text-xl font-display mb-2">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{template.description}</p>
              <p className="text-xs font-mono text-muted-foreground mb-4">{template.files.length} files</p>
              <button
                onClick={() => handleUseTemplate(template.id)}
                disabled={loading === template.id}
                className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300 disabled:opacity-50 w-fit group"
              >
                {loading === template.id ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</>
                ) : (
                  <>Use template <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-1" /></>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
