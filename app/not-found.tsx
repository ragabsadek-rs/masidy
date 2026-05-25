import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-mono text-muted-foreground mb-4">404</p>
      <h1 className="text-4xl font-display tracking-tight mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/"
          className="bg-foreground text-background px-5 h-9 text-sm font-medium hover:bg-foreground/90 transition-colors duration-150 flex items-center">
          Go home
        </Link>
        <Link href="/dashboard"
          className="border border-foreground/15 px-5 h-9 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-150 flex items-center">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
