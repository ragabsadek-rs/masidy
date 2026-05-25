import { Shield } from "lucide-react";
import Link from "next/link";

export default function FirewallRulesPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/firewall"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Firewall
          </Link>
          <span className="text-xs text-muted-foreground/40">/</span>
          <h1 className="text-sm font-medium">Rules</h1>
        </div>
        <Shield className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
        <Shield className="w-10 h-10 text-muted-foreground/20" />
        <div>
          <p className="text-sm font-medium mb-1">Firewall Rules</p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Custom firewall rules are managed from the{" "}
            <Link
              href="/dashboard/firewall"
              className="underline underline-offset-2 hover:text-foreground transition-colors duration-150"
            >
              Firewall overview
            </Link>
            . Advanced per-route rules are coming soon.
          </p>
        </div>
        <Link
          href="/dashboard/firewall"
          className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300"
        >
          Go to Firewall
        </Link>
      </div>
    </div>
  );
}
