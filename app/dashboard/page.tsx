"use client";

import { useState } from "react";
import {
  GitBranch,
  GitCommit,
  Globe,
  Github,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Search,
  MoreHorizontal,
  Eye,
  BarChart2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Activity,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

// ── Mock data ──────────────────────────────────────────────────────────────

const checklistItems = [
  { label: "Connect Git Repository", done: true },
  { label: "Add Custom Domain", done: false },
  { label: "Preview Deployment", done: true },
  { label: "Enable Web Analytics", done: true },
  { label: "Enable Speed Insights", done: false },
];

const observabilityData = [
  { time: "00:00", requests: 0 },
  { time: "04:00", requests: 0 },
  { time: "08:00", requests: 0 },
  { time: "12:00", requests: 0 },
  { time: "16:00", requests: 0 },
  { time: "20:00", requests: 0 },
  { time: "24:00", requests: 0 },
];

const branches = [
  {
    name: "v0/ragabsadek91-9468-712cabd4",
    preview: "8x3ocR6jn",
    previewColor: "bg-orange-500",
    source: "Source",
    author: "v0[bot]",
    authorColor: "bg-purple-500",
    time: "37m ago",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-mono text-muted-foreground">{children}</span>
  );
}

function StatCard({
  label,
  timeRange,
  children,
  href,
}: {
  label: string;
  timeRange: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="border border-foreground/10 p-4 flex flex-col gap-3 hover:border-foreground/20 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground font-mono">{timeRange}</span>
        </div>
        {href && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      {children}
    </div>
  );
}

function ProductionDeployment() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="border border-foreground/10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/10">
        <span className="text-sm font-medium">Production Deployment</span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground border border-foreground/10 px-3 h-7 hover:border-foreground/25 hover:text-foreground transition-colors duration-150">
            <ExternalLink className="w-3 h-3" />
            Open in
          </button>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground border border-foreground/10 px-3 h-7 hover:border-foreground/25 hover:text-foreground transition-colors duration-150">
            <Github className="w-3 h-3" />
            Repository
          </button>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground border border-foreground/10 px-3 h-7 hover:border-foreground/25 hover:text-foreground transition-colors duration-150">
            <RotateCcw className="w-3 h-3" />
            Instant Rollback
          </button>
          <div className="flex">
            <button className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150">
              Visit
            </button>
            <button className="flex items-center bg-foreground text-background px-2 h-7 border-l border-background/20 hover:bg-foreground/90 transition-colors duration-150">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[280px_1fr_auto] gap-0">
        {/* Preview thumbnail */}
        <div className="border-r border-foreground/10 bg-foreground/[0.02] flex items-center justify-center min-h-[160px]">
          <div className="w-full h-full p-4 flex flex-col gap-1.5 opacity-30">
            {[95, 70, 85, 60, 80, 65].map((w, i) => (
              <div key={i} className="h-2 bg-foreground/20 rounded-sm" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>

        {/* Deployment info */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Deployment</p>
            <p className="text-sm font-mono text-blue-500 hover:underline cursor-pointer">
              v0-optimus-the-ai-platform-to-653bajxx1.vercel.app
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Globe className="w-3 h-3" />
              Domains
            </div>
            <p className="text-sm font-mono text-blue-500 hover:underline cursor-pointer flex items-center gap-1">
              v0-optimus-the-ai-platform-to-bu-wine-eta.vercel.app
              <ExternalLink className="w-3 h-3" />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Ready</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm">47m ago by v0[bot]</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Source</p>
            <div className="flex items-center gap-1.5 text-sm">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
              <span>main</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm mt-1">
              <GitCommit className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">eebcfad</span>
              <span className="text-xs text-muted-foreground">Add README.md</span>
            </div>
          </div>
        </div>

        {/* Activity icon */}
        <div className="p-4 flex items-start">
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Deployment settings */}
      <div className="border-t border-foreground/10">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 w-full text-left"
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? "rotate-90" : ""}`} />
          Deployment Settings
          <span className="ml-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 font-mono text-[10px]">
            4 Recommendations
          </span>
        </button>
        {settingsOpen && (
          <div className="px-5 pb-4 text-xs text-muted-foreground border-t border-foreground/10 pt-3">
            Review deployment settings and apply recommendations to improve performance and security.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-foreground/10 px-5 py-2.5 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          To update your Production Deployment, push to the{" "}
          <code className="font-mono bg-foreground/5 px-1">main</code> branch.
        </p>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
            <BarChart2 className="w-3.5 h-3.5" />
            Deployments
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductionChecklist() {
  const done = checklistItems.filter((i) => i.done).length;
  return (
    <StatCard label="Production Checklist" timeRange={`${done}/${checklistItems.length}`} href="#">
      <div className="flex flex-col gap-0.5">
        {checklistItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 px-2 py-1.5 text-xs transition-colors duration-150 ${
              item.done ? "bg-blue-500/8 text-foreground" : "text-muted-foreground hover:bg-foreground/5"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className={item.done ? "text-blue-500" : ""}>{item.label}</span>
            {item.done && <CheckCircle2 className="w-3 h-3 text-blue-500 ml-auto" />}
          </div>
        ))}
      </div>
    </StatCard>
  );
}

function ObservabilityCard() {
  return (
    <StatCard label="Observability" timeRange="6h" href="#">
      <div className="flex flex-col gap-3">
        <div className="border-b border-foreground/10 pb-3">
          <p className="text-xs text-muted-foreground mb-1">Edge Requests</p>
          <p className="text-2xl font-display">0</p>
        </div>
        <div className="border-b border-foreground/10 pb-3">
          <p className="text-xs text-muted-foreground mb-1">Function Invocations</p>
          <p className="text-2xl font-display">0</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
          <p className="text-2xl font-display">0%</p>
        </div>
      </div>
    </StatCard>
  );
}

function AnalyticsCard() {
  return (
    <StatCard label="Analytics" timeRange="1w" href="#">
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <AlertCircle className="w-5 h-5 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No data</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
          0 online
        </div>
      </div>
    </StatCard>
  );
}

function ActiveBranches() {
  const [search, setSearch] = useState("");
  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mt-8">
      <h2 className="text-base font-medium mb-4">Active Branches</h2>
      <div className="border border-foreground/10">
        {/* Search + filter */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-foreground/10">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full h-7 pl-8 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/50 font-sans"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">Status 5/6</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Branch rows */}
        {filtered.map((branch) => (
          <div
            key={branch.name}
            className="flex items-center gap-4 px-4 py-3 border-b border-foreground/10 last:border-b-0 hover:bg-foreground/[0.02] transition-colors duration-150"
          >
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-mono flex-1 truncate">{branch.name}</span>
            <div className="flex items-center gap-4 shrink-0">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                <Eye className="w-3 h-3" />
                Preview
              </button>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${branch.previewColor}`} />
                <span className="text-xs font-mono text-muted-foreground">{branch.preview}</span>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                <Github className="w-3 h-3" />
                Source
              </button>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${branch.authorColor}`} />
                <span className="text-xs text-muted-foreground">{branch.author}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{branch.time}</span>
              <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Project breadcrumb */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-foreground/80 flex items-center justify-center">
              <span className="text-background text-[8px] font-mono">M</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">v0-optimus-the-ai-platform-to-bu</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        <span className="text-sm font-medium absolute left-1/2 -translate-x-1/2">Overview</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-mono font-medium">v0</span>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 py-6 max-w-[1200px] w-full mx-auto">
        {/* Production deployment */}
        <ProductionDeployment />

        {/* 3-col stats */}
        <div className="grid grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 mt-6">
          <ProductionChecklist />
          <ObservabilityCard />
          <AnalyticsCard />
        </div>

        {/* Active branches */}
        <ActiveBranches />
      </div>
    </div>
  );
}
