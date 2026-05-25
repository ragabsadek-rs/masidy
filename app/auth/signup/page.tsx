"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Github, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
  }

  async function handleGitHub() {
    setOauthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <span className="text-green-500 text-sm">✓</span>
        </div>
        <h2 className="text-lg font-medium mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and get 10 free credits.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-0.5">
            <span className="text-2xl font-display tracking-tight">masidy</span>
            <span className="text-2xl font-display text-blue-500">.</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Create your account — 10 free credits included</p>
        </div>

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

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)" required minLength={8}
            className="w-full h-10 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150 placeholder:text-muted-foreground/50" />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full h-10 bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-foreground underline underline-offset-4 hover:no-underline">Sign in</Link>
        </p>
        <p className="text-center text-[10px] text-muted-foreground/60 mt-3">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
