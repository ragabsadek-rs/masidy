"use client";

import { useState } from "react";
import { Flag, Plus, Toggle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function FlagsPage() {
  const [flags] = useState<{ name: string; enabled: boolean; description: string }[]>([]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Feature Flags</h1>
        <button className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
          <Plus className="w-3 h-3" />Create Flag
        </button>
      </div>
      <div className="flex-1 px-6 py-6 max-w-3xl">
        {flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Flag className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No feature flags yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">Use feature flags to safely roll out new features to specific users or percentages of traffic.</p>
            </div>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {flags.map((flag, i) => (
              <div key={flag.name} className={`flex items-center gap-4 px-4 py-3 ${i < flags.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{flag.name}</p>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 ${flag.enabled ? "bg-green-500/10 text-green-600" : "bg-foreground/5 text-muted-foreground"}`}>
                  {flag.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
