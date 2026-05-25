"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-6" />
      <h1 className="text-2xl font-display tracking-tight mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        An unexpected error occurred. If this keeps happening, please contact support.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-foreground text-background px-5 h-9 text-sm font-medium hover:bg-foreground/90 transition-colors duration-150"
        >
          <RefreshCw className="w-3.5 h-3.5" />Try again
        </button>
        <Link href="/"
          className="flex items-center gap-2 border border-foreground/15 px-5 h-9 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-150">
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="text-[10px] font-mono text-muted-foreground/40 mt-8">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
