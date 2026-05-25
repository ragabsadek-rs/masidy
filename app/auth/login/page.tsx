"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Github, Loader2 } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(redirect);
    router.refresh();
  }

  async function handleGitHub() {
    setOauthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-0.5">
            <span className="text-2xl font-display tracking-tight">masidy</span>
            <span className="text-2xl font-display text-blue-500">.</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {/* GitHub OAuth */}
        <button onClick={handleGitHub} disabled={oauthLoading}
          className="w-full flex items-center justify-center gap-2 border border-foreground/15 h-10 text-sm hover:bg-foreground/5 transition-colors duration-150 mb-4 disabled:opacity-50">
          {oauthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
          Continue with GitHub
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-foreground/10" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-foreground/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50" />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full h-10 bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          No account?{" "}
          <Link href="/auth/signup" className="text-foreground underline underline-offset-4 hover:no-underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
