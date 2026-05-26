"use client";

import { useEffect, useState } from "react";
import {
  GitBranch, GitCommit, Globe, Github, RotateCcw, ExternalLink,
  ChevronDown, ChevronRight, Search, MoreHorizontal, Eye,
  BarChart2, CheckCircle2, Circle, Activity, RefreshCw, Zap,
} from "lucide-react";
import { deploymentStatusColor, timeAgo } from "@/lib/vercel";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Deployment {
  uid: string; url: string; state: string; created: number; target?: string;
  meta?: { githubCommitRef?: string; githubCommitMessage?: string; githubCommitSha?: string; githubCommitAuthorName?: string };
}
interface Domain { name: string; verified: boolean; }
interface ProjectData { project: { name: string; framework?: string; link?: { type: string; repo?: string } }; domains: Domain[]; deployments: Deployment[]; }

function SkeletonBlock({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} bg-foreground/8 animate-pulse`} />;
}

export default function DashboardPage() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const [proj, cred] = await Promise.all([
      fetch("/api/vercel/project").then(r => r.json()),
      fetch("/api/credits/balance").then(r => r.json()).catch(() => ({ balance: null })),
    ]);
    setData(proj);
    setCredits(cred.balance);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const prod = data?.deployments?.find(d => d.target === "production") ?? data?.deployments?.[0];
  const branches = data?.deployments?.filter(d => d.target !== "production") ?? [];
  const filtered = branches.filter(b => !search || b.meta?.githubCommitRef?.includes(search) || b.url?.includes(search));

  return (
    <div className="flex flex-col min-h-full overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-background text-[8px] font-mono">M</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
            {loading ? "…" : data?.project?.name ?? "masidy"}
          </span>
        </div>
        <span className="text-sm font-medium absolute left-1/2 -translate-x-1/2">Overview</span>
        <div className="flex items-center gap-3">
          {credits !== null && (
            <Link href="/dashboard/billing" className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors duration-150">
              <Zap className="w-3 h-3 text-blue-500" />
              {credits} credits
            </Link>
          )}
          <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors duration-150">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-[1200px] w-full mx-auto">

        {/* Production Deployment */}
        <div className="border border-foreground/10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/10">
            <span className="text-sm font-medium">Production Deployment</span>
            <div className="flex items-center gap-2">
              {prod && (
                <>
                  <a href={`https://${prod.url}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground border border-foreground/10 px-3 h-7 hover:border-foreground/25 hover:text-foreground transition-colors duration-150">
                    <ExternalLink className="w-3 h-3" />Open in
                  </a>
                  {data?.project?.link?.repo && (
                    <a href={`https://github.com/${data.project.link.repo}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground border border-foreground/10 px-3 h-7 hover:border-foreground/25 hover:text-foreground transition-colors duration-150">
                      <Github className="w-3 h-3" />Repository
                    </a>
                  )}
                  <a href={`https://${prod.url}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
                    Visit
                  </a>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              <SkeletonBlock h="h-4" w="w-64" />
              <SkeletonBlock h="h-4" w="w-48" />
              <SkeletonBlock h="h-4" w="w-32" />
            </div>
          ) : prod ? (
            <div className="grid grid-cols-[260px_1fr_auto]">
              {/* Preview */}
              <div className="border-r border-foreground/10 bg-foreground/[0.02] flex items-center justify-center min-h-[160px]">
                <div className="w-full h-full p-4 flex flex-col gap-1.5 opacity-25">
                  {[95, 70, 85, 60, 80, 65].map((w, i) => (
                    <div key={i} className="h-2 bg-foreground/30 rounded-sm" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deployment</p>
                  <a href={`https://${prod.url}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-mono text-blue-500 hover:underline">{prod.url}</a>
                </div>
                {data?.domains && data.domains.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Globe className="w-3 h-3" />Domains
                    </div>
                    {data.domains.slice(0, 2).map(d => (
                      <a key={d.name} href={`https://${d.name}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-mono text-blue-500 hover:underline flex items-center gap-1 mb-0.5">
                        {d.name}<ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${deploymentStatusColor(prod.state)}`} />
                      <span className="text-sm font-medium capitalize">{prod.state?.toLowerCase()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm">{timeAgo(prod.created)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Source</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{prod.meta?.githubCommitRef ?? "main"}</span>
                  </div>
                  {prod.meta?.githubCommitSha && (
                    <div className="flex items-center gap-1.5 text-sm mt-1">
                      <GitCommit className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">{prod.meta.githubCommitSha.slice(0, 7)}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{prod.meta.githubCommitMessage}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4"><Activity className="w-4 h-4 text-muted-foreground" /></div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No production deployment yet</div>
          )}

          {/* Settings */}
          <div className="border-t border-foreground/10">
            <button onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 w-full text-left">
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? "rotate-90" : ""}`} />
              Deployment Settings
            </button>
            {settingsOpen && (
              <div className="px-5 pb-4 border-t border-foreground/10 pt-3 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">Framework:</span> {data?.project?.framework ?? "Next.js"}</div>
                <div><span className="font-medium text-foreground">Region:</span> iad1 (Washington D.C.)</div>
                <div><span className="font-medium text-foreground">Node version:</span> 20.x</div>
                <div><span className="font-medium text-foreground">Build command:</span> npm run build</div>
              </div>
            )}
          </div>

          <div className="border-t border-foreground/10 px-5 py-2.5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Push to <code className="font-mono bg-foreground/5 px-1">main</code> to update Production.
            </p>
            <Link href="/dashboard/deployments"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              <BarChart2 className="w-3.5 h-3.5" />Deployments
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 mt-6">
          {/* Checklist */}
          <div className="bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Production Checklist</span>
              <span className="text-xs font-mono text-muted-foreground">
                {data?.domains?.some(d => d.verified) ? "3" : "2"}/5
              </span>
            </div>
            {[
              { label: "Connect Git Repository", done: !!data?.project?.link },
              { label: "Add Custom Domain", done: data?.domains?.some(d => d.verified) ?? false },
              { label: "Production Deployment", done: !!prod && prod.state === "READY" },
              { label: "Enable Web Analytics", done: false },
              { label: "Enable Speed Insights", done: false },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-2 px-2 py-1.5 text-xs ${item.done ? "bg-blue-500/8 text-blue-500" : "text-muted-foreground"}`}>
                {item.done ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 shrink-0" />}
                {item.label}
              </div>
            ))}
          </div>

          {/* Observability */}
          <div className="bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Observability</span>
              <Link href="/dashboard/logs" className="text-xs text-muted-foreground hover:text-foreground">View logs →</Link>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Deployments", value: data?.deployments?.length ?? 0 },
                { label: "Production", value: data?.deployments?.filter(d => d.target === "production").length ?? 0 },
                { label: "Ready", value: data?.deployments?.filter(d => d.state === "READY").length ?? 0 },
              ].map(stat => (
                <div key={stat.label} className="border-b border-foreground/10 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-display">{loading ? "—" : stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Credits */}
          <div className="bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Credits</span>
              <Link href="/dashboard/billing" className="text-xs text-muted-foreground hover:text-foreground">Buy more →</Link>
            </div>
            <div className="flex flex-col gap-3">
              <div className="border-b border-foreground/10 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className="text-2xl font-display">{credits ?? "—"}</p>
              </div>
              <div className="border-b border-foreground/10 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Lite message</p>
                <p className="text-sm font-mono">0.5 credits</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Standard message</p>
                <p className="text-sm font-mono">2 credits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Branches */}
        <div className="mt-8">
          <h2 className="text-base font-medium mb-4">Active Branches</h2>
          <div className="overflow-x-auto">
          <div className="border border-foreground/10">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-foreground/10">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search branches…"
                  className="w-full h-7 pl-8 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/50" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">{filtered.length} branches</span>
            </div>
            {loading ? (
              <div className="p-4 flex flex-col gap-2">{[...Array(3)].map((_, i) => <SkeletonBlock key={i} h="h-10" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No active branches</div>
            ) : filtered.map((b, i) => (
              <div key={b.uid} className={`flex items-center gap-4 px-4 py-3 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < filtered.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-mono flex-1 truncate">{b.meta?.githubCommitRef ?? b.url}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <a href={`https://${b.url}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                    <Eye className="w-3 h-3" />Preview
                  </a>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${deploymentStatusColor(b.state)}`} />
                    <span className="text-xs font-mono text-muted-foreground capitalize">{b.state?.toLowerCase()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{timeAgo(b.created)}</span>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
