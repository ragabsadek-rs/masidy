"use client";

import { Flag, ExternalLink, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default function FlagsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Feature Flags</h1>
        <a href="https://vercel.com/docs/workflow-collaboration/feature-flags" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
          <Plus className="w-3 h-3" />Create Flag
        </a>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Flag className="w-10 h-10 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-medium mb-1">No feature flags yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">Use Vercel Feature Flags to safely roll out features to specific users or percentages of traffic.</p>
          </div>
          <a href="https://vercel.com/docs/workflow-collaboration/feature-flags" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline">Learn about Feature Flags →</a>
        </div>
      </div>
    </div>
  );
}
