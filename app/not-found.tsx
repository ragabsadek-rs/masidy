import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-x-hidden flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find the page you're looking for.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full h-10 bg-foreground text-background font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
          >
            Back to home
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/docs"
            className="w-full h-10 border border-foreground/15 flex items-center justify-center hover:bg-foreground/5 transition-colors"
          >
            View documentation
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Lost?{" "}
          <Link href="/contact" className="underline underline-offset-2 hover:no-underline">
            Get help
          </Link>
        </p>
      </div>
    </main>
  );
}
