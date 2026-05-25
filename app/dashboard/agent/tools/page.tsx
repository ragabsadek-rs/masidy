"use client";

import { useEffect, useState } from "react";
import { Cpu, Globe, Terminal, Database, Zap, Monitor } from "lucide-react";

export const dynamic = "force-dynamic";

interface McpTool {
  id: string;
  name: string;
  description: string;
  status: "active" | "available";
  icon: React.ElementType;
}

const MCP_TOOLS: McpTool[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Read and write files on the local or remote filesystem. Supports directory traversal, file creation, editing, and deletion.",
    status: "active",
    icon: Cpu,
  },
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for up-to-date information, documentation, and resources. Returns ranked results with snippets.",
    status: "active",
    icon: Globe,
  },
  {
    id: "code_execution",
    name: "Code Execution",
    description: "Run code in an isolated sandbox environment. Supports multiple languages including Python, JavaScript, and TypeScript.",
    status: "active",
    icon: Terminal,
  },
  {
    id: "database",
    name: "Database",
    description: "Query and mutate databases using SQL or ORM-style commands. Supports Postgres, SQLite, and Supabase.",
    status: "available",
    icon: Database,
  },
  {
    id: "api_caller",
    name: "API Caller",
    description: "Call external REST or GraphQL APIs with full control over headers, body, and authentication. Handles retries and error parsing.",
    status: "available",
    icon: Zap,
  },
  {
    id: "browser",
    name: "Browser",
    description: "Control a headless browser to navigate pages, click elements, fill forms, and extract content from dynamic web applications.",
    status: "available",
    icon: Monitor,
  },
];

function ToolCardSkeleton() {
  return (
    <div className="border border-foreground/10 p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 animate-pulse bg-foreground/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 animate-pulse bg-foreground/10" />
            <div className="h-4 w-16 animate-pulse bg-foreground/10" />
          </div>
          <div className="h-3 w-full animate-pulse bg-foreground/10" />
          <div className="h-3 w-3/4 animate-pulse bg-foreground/10" />
          <div className="h-3 w-20 animate-pulse bg-foreground/10 mt-3" />
        </div>
      </div>
    </div>
  );
}

export default function AgentToolsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">MCP Tools</h1>
        {!loading && (
          <span className="text-xs font-mono text-muted-foreground">
            {MCP_TOOLS.filter(t => t.status === "active").length} active &middot;{" "}
            {MCP_TOOLS.filter(t => t.status === "available").length} available
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 max-w-3xl">
        <p className="text-xs text-muted-foreground mb-6">
          Tools available to Masidy agents via the Model Context Protocol. Active tools are loaded into every agent session automatically.
        </p>

        <div className="flex flex-col gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ToolCardSkeleton key={i} />)
            : MCP_TOOLS.map(tool => {
                const Icon = tool.icon;
                const isActive = tool.status === "active";
                return (
                  <div
                    key={tool.id}
                    className="border border-foreground/10 p-5 hover:border-foreground/25 transition-colors duration-300 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-8 h-8 border border-foreground/10 flex items-center justify-center shrink-0 bg-foreground/[0.02]">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{tool.name}</p>
                          {/* Status badge */}
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground border border-foreground/10 px-1.5 py-0.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isActive ? "bg-green-500" : "bg-foreground/20"
                              }`}
                            />
                            {tool.status}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {tool.description}
                        </p>

                        {/* Tool ID */}
                        <span className="text-[10px] font-mono text-muted-foreground bg-foreground/5 border border-foreground/10 px-2 py-0.5">
                          {tool.id}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
