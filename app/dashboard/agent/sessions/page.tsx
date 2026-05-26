"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Project { id: string; name: string; files: unknown[]; updated_at: string; }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AgentSessionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => {
      setProjects(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Chat History</h1>
        {!loading && <span className="text-xs font-mono text-muted-foreground">{projects.length} session{projects.length !== 1 ? "s" : ""}</span>}
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {loading ? (
          <div className="border border-foreground/10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-4 ${i < 4 ? "border-b border-foreground/10" : ""}`}>
                <div className="h-4 w-48 animate-pulse bg-foreground/10 flex-1" />
                <div className="h-3 w-16 animate-pulse bg-foreground/10" />
                <div className="h-7 w-16 animate-pulse bg-foreground/10" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-foreground/10 px-4 py-16 flex flex-col items-center gap-4 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No sessions yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">Start a conversation with Masidy AI and your sessions will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="border border-foreground/10">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
              {["Project", "Files", "Last updated"].map(h => (
                <span key={h} className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{h}</span>
              ))}
            </div>
            {projects.map((p, i) => (
              <div key={p.id} className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < projects.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{p.name}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{(p.files as unknown[]).length}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">{timeAgo(p.updated_at)}</span>
                  <Link href={`/builder?projectId=${p.id}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                    Open <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
