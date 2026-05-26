"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Users, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function AcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setErrorMsg("No invite token provided."); return; }

    fetch("/api/team/accept", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(r => r.json()).then(data => {
      if (data.success) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Invalid or expired invite link.");
      }
    }).catch(() => {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-0.5">
            <span className="text-2xl font-display tracking-tight">masidy</span>
            <span className="text-2xl font-display text-blue-500">.</span>
          </Link>
        </div>

        {status === "loading" && (
          <div className="border border-foreground/10 p-8">
            <div className="flex justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground/40 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Accepting your invitation…</p>
          </div>
        )}

        {status === "success" && (
          <div className="border border-foreground/10 p-8">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-display mb-2">You&apos;ve joined the team!</h1>
            <p className="text-sm text-muted-foreground mb-6">Redirecting you to the dashboard…</p>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-6 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300">
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="border border-foreground/10 p-8">
            <div className="flex justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-display mb-2">Invite not valid</h1>
            <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-6 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
      </div>
    }>
      <AcceptContent />
    </Suspense>
  );
}
