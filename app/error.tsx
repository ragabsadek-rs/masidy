"use client";

import Link from "next/link";
import { AlertCircle, Home, ArrowRight } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative min-h-screen overflow-x-hidden flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-2">
          We encountered an unexpected error. Our team has been notified.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground/70 font-mono mb-6 bg-muted p-3 rounded">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full h-10 bg-foreground text-background font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
          >
            Try again
          </button>

          <Link
            href="/"
            className="w-full h-10 border border-foreground/15 flex items-center justify-center gap-2 hover:bg-foreground/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Need help?{" "}
          <Link href="/contact" className="underline underline-offset-2 hover:no-underline">
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}
