"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  async function handleResend() {
    if (!email) {
      toast({
        title: "No email address",
        description: "Please go back to sign up and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);

    if (error) {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent",
        description: `Confirmation link resent to ${email}.`,
      });
    }
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
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 border border-foreground/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-display tracking-tight mb-2">Check your inbox</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to{" "}
            {email ? (
              <span className="text-foreground font-medium">{email}</span>
            ) : (
              "your email address"
            )}
            . Click it to activate your account and get 10 free credits.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-foreground/10 mb-6" />

        {/* Resend section */}
        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground mb-4">
            Didn&apos;t receive it? Check your spam folder or resend below.
          </p>
          <button
            onClick={handleResend}
            disabled={loading}
            className="w-full h-12 bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 rounded-full px-8 hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Resend confirmation email
              </>
            )}
          </button>
        </div>

        {/* Footer links */}
        <p className="text-center text-xs text-muted-foreground">
          Wrong email?{" "}
          <Link
            href="/auth/signup"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Sign up again
          </Link>
          {" · "}
          <Link
            href="/auth/login"
            className="text-foreground underline underline-offset-4 hover:no-underline inline-flex items-center gap-1"
          >
            Sign in <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>

      <Toaster />
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
