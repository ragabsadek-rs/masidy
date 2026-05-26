"use client";

import { useState, useCallback, Suspense, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { FileTree, FileNode } from "@/components/builder/file-tree";
import { CodeEditor } from "@/components/builder/code-editor";
import {
  ChevronsLeft, ChevronsRight, Eye, Code2, FolderOpen, Database,
  ChevronLeft, ChevronRight, Monitor, Tablet, Smartphone,
  ExternalLink, RefreshCw, TerminalSquare, MoreHorizontal,
  GitBranch, Share2, Globe, X, Trash2, Copy, Plus,
  GitMerge, GitPullRequest, BarChart2, Link2, KeyRound, Layers,
  User, Settings, DollarSign, BookOpen, Users, MessageSquare,
  Gift, Coins, LogOut, Sun, Moon, Laptop, Download, ChevronDown,
  ChevronRight as ChevronR, Image, Figma, Upload, Sparkles,
  Zap, Check, ArrowUp, RotateCcw, Clock, Shield, ToggleLeft,
  Cpu, MoreVertical,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type AgentModel = "lite" | "standard" | "opus";
type RightTab = "preview" | "code" | "files" | "database";
type Viewport = "desktop" | "tablet" | "mobile";

export interface Message {
  id: string; role: "user" | "assistant";
  content: string; files?: FileNode[]; timestamp: Date;
}

const VIEWPORTS: { key: Viewport; icon: React.ReactNode; w: string }[] = [
  { key: "desktop", icon: <Monitor className="w-3.5 h-3.5" />, w: "100%" },
  { key: "tablet",  icon: <Tablet   className="w-3.5 h-3.5" />, w: "768px" },
  { key: "mobile",  icon: <Smartphone className="w-3.5 h-3.5" />, w: "375px" },
];

const MODELS = [
  { id: "lite",     label: "Masidy Lite",     icon: "M", desc: "Fast and lightweight" },
  { id: "standard", label: "Masidy Standard", icon: "M", desc: "Balanced for most apps" },
  { id: "opus",     label: "Masidy Pro",      icon: "M", desc: "Powerful full project mode" },
];
const MORE_MODELS = [
  { id: "lite",     label: "Lite / Haiku",     icon: "✳" },
  { id: "standard", label: "Standard / Sonnet", icon: "✳" },
  { id: "opus",     label: "Pro / Opus",       icon: "✳" },
];

// ── Upgrade Modal ──────────────────────────────────────────────────────────
const PLANS = [
  { key: "premium",    label: "Premium" },
  { key: "team",       label: "Team" },
  { key: "business",   label: "Business" },
  { key: "enterprise", label: "Enterprise" },
];
function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [plan, setPlan] = useState("team");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background border border-foreground/10 w-[520px] max-h-[90vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Plan tabs */}
        <div className="flex border-b border-foreground/10">
          {PLANS.map((p) => (
            <button key={p.key} onClick={() => setPlan(p.key)}
              className={`flex-1 py-2.5 text-sm transition-colors duration-150 ${plan === p.key ? "border-b-2 border-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-display mb-1">Team</h2>
          <p className="text-sm text-muted-foreground mb-6">Unlimited messages, $90 in value per user</p>
          {[
            { icon: <Coins className="w-4 h-4" />, title: "$30 monthly credits per user", desc: "Unused credits roll over to the next month." },
            { icon: <Clock className="w-4 h-4" />, title: "$2 daily login credits", desc: "Get $60 in credits per month when you login daily.", badge: "$60/mo value" },
            { icon: <Download className="w-4 h-4" />, title: "Purchase additional credits", desc: "Buy more credits outside your monthly limits." },
            { icon: <Users className="w-4 h-4" />, title: "Unlimited projects", desc: "Create and manage unlimited projects." },
            { icon: <Shield className="w-4 h-4" />, title: "Masidy API access", desc: "Access to Masidy through API." },
            { icon: <Users className="w-4 h-4" />, title: "Free viewer seats", desc: "Add members with viewer permissions for free." },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 mb-4">
              <div className="shrink-0 mt-0.5 text-muted-foreground">{item.icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.badge && <span className="text-[10px] border border-foreground/20 px-1.5 py-0.5 font-mono">{item.badge}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
          <div className="border-t border-foreground/10 pt-4 mt-4 flex items-center justify-between mb-4">
            <span className="text-sm">Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground line-through">$90/mo</span>
              <span className="text-xl font-display">$30/mo</span>
            </div>
          </div>
          <button className="w-full bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/90 transition-colors duration-150">
            Activate Masidy Team
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Panel ─────────────────────────────────────────────────────────────
function ChatPanel({ messages, isLoading, onSend, onReset, credits }: {
  messages: Message[]; isLoading: boolean;
  onSend: (c: string, m: AgentModel) => void; onReset: () => void;
  credits: number | null;
}) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<AgentModel>("lite");
  const [modelLabel, setModelLabel] = useState("Masidy Lite");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [generateImages, setGenerateImages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectModel = (id: AgentModel, label: string) => { setModel(id); setModelLabel(label); };

  function handleSend() {
    const v = input.trim(); if (!v || isLoading) return;
    onSend(v, model); setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 text-sm">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">What do you want to build?</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">Describe your app and Masidy will write the code, set up files, and deploy it live.</p>
            </div>
            {["Build a SaaS dashboard with auth", "Create a REST API with Next.js", "Make a landing page for my startup"].map((s) => (
              <button key={s} onClick={() => setInput(s)}
                className="text-xs text-left px-3 py-2 border border-foreground/10 hover:border-foreground/25 hover:bg-foreground/5 transition-all duration-150 text-muted-foreground hover:text-foreground w-full max-w-[260px]">
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "flex justify-end" : "flex gap-2"}`}>
              {msg.role === "assistant" && (
                <div className="w-5 h-5 rounded-full bg-foreground/8 border border-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-foreground/50" />
                </div>
              )}
              <div className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-foreground text-background rounded-2xl rounded-br-sm"
                  : "bg-foreground/5 border border-foreground/10 rounded-2xl rounded-bl-sm text-foreground"
              }`}>
                {msg.content}
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-foreground/10 flex flex-wrap gap-1">
                    {msg.files.map((f) => (
                      <span key={f.path} className="text-[10px] font-mono bg-foreground/8 border border-foreground/10 px-1.5 py-0.5">{f.path}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-foreground/8 border border-foreground/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-foreground/50" />
            </div>
            <div className="bg-foreground/5 border border-foreground/10 rounded-2xl rounded-bl-sm px-3 py-2.5">
              <div className="flex gap-1">{[0,1,2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
              ))}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-foreground/10 px-3 pt-2 pb-1">
        <div className="border border-foreground/15 rounded-xl overflow-hidden focus-within:border-foreground/30 transition-colors duration-200 bg-background">
          <textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={handleKey}
            placeholder="Ask a follow-up…" rows={1}
            className="w-full px-3 pt-2.5 pb-1 text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
            style={{ minHeight: 40, maxHeight: 160 }} />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-0.5">
              {/* + menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded transition-colors duration-150">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-52">
                  <DropdownMenuItem className="text-xs">
                    <Figma className="w-3.5 h-3.5 mr-2 text-[#F24E1E]" />Create from Figma
                    <span className="ml-auto text-[10px] bg-foreground text-background px-1.5 py-0.5 font-mono">Premium</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs"><Upload className="w-3.5 h-3.5 mr-2" />Upload from computer</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs flex items-center gap-2"><Image className="w-3.5 h-3.5" />Generate Images</span>
                    <Switch checked={generateImages} onCheckedChange={setGenerateImages} className="scale-75" />
                  </div>
                  <DropdownMenuItem className="text-xs"><BookOpen className="w-3.5 h-3.5 mr-2" />Instructions<ChevronR className="w-3 h-3 ml-auto" /></DropdownMenuItem>
                  <DropdownMenuItem className="text-xs"><Cpu className="w-3.5 h-3.5 mr-2" />MCPs<ChevronR className="w-3 h-3 ml-auto" /></DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs"><Shield className="w-3.5 h-3.5 mr-2" />Auto Permissions</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44">
                      <DropdownMenuItem className="text-xs"><Shield className="w-3 h-3 mr-2" />Ask Permissions</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs"><Check className="w-3 h-3 mr-2 text-foreground" />Auto Permissions</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs"><Shield className="w-3 h-3 mr-2" />Full Permissions</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Design mode / image icon */}
              <div className="relative group">
                <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded transition-colors duration-150">
                  <Image className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                  <div className="bg-background border border-foreground/10 shadow-lg p-3 w-48">
                    <p className="text-xs font-medium mb-1">Enable design mode</p>
                    <p className="text-[10px] text-muted-foreground mb-2">Select, screenshot, and prompt</p>
                    <div className="border border-foreground/10 p-2 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-foreground/40 flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-foreground/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Model picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-foreground/5 px-3 py-1 rounded transition-colors duration-150">
                    <div className="w-3.5 h-3.5 rounded-sm bg-foreground flex items-center justify-center shrink-0">
                      <span className="text-background text-[7px] font-bold">M</span>
                    </div>
                    <span>{modelLabel}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-44">
                  {MODELS.map((m) => (
                    <DropdownMenuItem key={m.label} className="text-xs"
                      onClick={() => selectModel(m.id as AgentModel, m.label)}>
                      <div className="w-3.5 h-3.5 rounded-sm bg-foreground flex items-center justify-center mr-2 shrink-0">
                        <span className="text-background text-[7px] font-bold">{m.icon}</span>
                      </div>
                      {m.label}
                      {m.label === modelLabel && <Check className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">More models</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                      {MORE_MODELS.map((m) => (
                        <DropdownMenuItem key={m.label} className="text-xs"
                          onClick={() => selectModel(m.id as AgentModel, m.label)}>
                          <span className="mr-2 text-sm">{m.icon}</span>{m.label}
                          {m.label === modelLabel && <Check className="w-3 h-3 ml-auto" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Upgrade */}
              <button onClick={() => setShowUpgrade(true)}
                className="text-[11px] font-medium bg-foreground text-background px-2.5 h-6 hover:bg-foreground/90 transition-colors duration-150">
                Upgrade
              </button>

              {/* Send */}
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className="w-7 h-7 flex items-center justify-center bg-foreground text-background rounded-full disabled:opacity-30 hover:bg-foreground/80 transition-colors duration-150">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5 pb-1">
          {credits !== null && credits <= 0
            ? <>Out of credits. <button onClick={() => setShowUpgrade(true)} className="underline hover:text-foreground">Buy more</button></>
            : credits !== null
            ? <span className="font-mono">{credits} credits remaining</span>
            : null
          }
        </p>
      </div>
    </div>
  );
}

// ── Top bar ────────────────────────────────────────────────────────────────
function TopBar({ previewUrl, branch, credits, onDeploy, isDeploying, files }: {
  previewUrl: string | null; branch: string;
  credits: number | null; onDeploy: () => void;
  isDeploying: boolean; files: FileNode[];
}) {
  return (
    <div className="flex items-center h-10 border-b border-foreground/10 bg-background shrink-0 px-3 gap-2">
      <Link href="/dashboard" className="flex items-center gap-1 shrink-0">
        <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
          <span className="text-background text-[9px] font-mono font-bold">M</span>
        </div>
      </Link>
      <span className="text-xs text-muted-foreground">/</span>
      <span className="text-xs font-medium truncate max-w-[140px]">builder</span>

      <div className="flex-1 flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1 hover:bg-foreground/5 transition-colors duration-150">
              <GitBranch className="w-3 h-3" />{branch}<ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-44">
            <DropdownMenuItem className="text-xs font-mono"><GitBranch className="w-3 h-3 mr-2" />main</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Credits display */}
        {credits !== null && (
          <Link href="/dashboard/billing" className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors duration-150">
            <Zap className="w-3 h-3 text-blue-500" />{credits}
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="text-xs"><ExternalLink className="w-3.5 h-3.5 mr-2" />Open in New Tab</DropdownMenuItem>
            <DropdownMenuItem className="text-xs"><Download className="w-3.5 h-3.5 mr-2" />Download ZIP</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Deploy button */}
        {files.length > 0 && (
          <button
            onClick={onDeploy}
            disabled={isDeploying}
            className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-7 font-medium hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-50"
          >
            {isDeploying ? (
              <><RefreshCw className="w-3 h-3 animate-spin" />Deploying…</>
            ) : (
              <><Zap className="w-3 h-3" />Deploy</>
            )}
          </button>
        )}

        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs border border-foreground/15 text-muted-foreground px-2.5 h-7 hover:border-foreground/30 hover:text-foreground transition-colors duration-150">
            <Globe className="w-3 h-3" />Visit
          </a>
        )}
      </div>
    </div>
  );
}

// ── Right toolbar ──────────────────────────────────────────────────────────
function RightToolbar({ tab, onTab, chatCollapsed, onToggleChat, viewport, onViewport,
  previewUrl, onRefresh, showTerminal, onToggleTerminal, activeFile }: {
  tab: RightTab; onTab: (t: RightTab) => void;
  chatCollapsed: boolean; onToggleChat: () => void;
  viewport: Viewport; onViewport: (v: Viewport) => void;
  previewUrl: string | null; onRefresh: () => void;
  showTerminal: boolean; onToggleTerminal: () => void;
  activeFile: FileNode | null;
}) {
  const TABS = [
    { key: "preview" as RightTab,  icon: <Eye      className="w-3.5 h-3.5" /> },
    { key: "code"    as RightTab,  icon: <Code2    className="w-3.5 h-3.5" /> },
    { key: "files"   as RightTab,  icon: <FolderOpen className="w-3.5 h-3.5" /> },
    { key: "database"as RightTab,  icon: <Database className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="flex items-center h-9 border-b border-foreground/10 bg-background shrink-0 px-2 gap-0.5">
      <button onClick={onToggleChat} title={chatCollapsed ? "Show chat" : "Hide chat"}
        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
        {chatCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>
      <div className="w-px h-4 bg-foreground/10 mx-1" />
      {TABS.map((t) => (
        <button key={t.key} onClick={() => onTab(t.key)}
          className={`w-7 h-7 flex items-center justify-center transition-colors duration-150 ${tab === t.key ? "text-foreground bg-foreground/8" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}>
          {t.icon}
        </button>
      ))}
      {tab === "preview" && (
        <>
          <div className="w-px h-4 bg-foreground/10 mx-1" />
          <button className="w-6 h-7 flex items-center justify-center text-muted-foreground/40"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <button className="w-6 h-7 flex items-center justify-center text-muted-foreground/40"><ChevronRight className="w-3.5 h-3.5" /></button>
          {VIEWPORTS.map((vp) => (
            <button key={vp.key} onClick={() => onViewport(vp.key)}
              className={`w-7 h-7 flex items-center justify-center transition-colors duration-150 ${viewport === vp.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {vp.icon}
            </button>
          ))}
          <div className="w-px h-4 bg-foreground/10 mx-1" />
          <span className="text-xs font-mono text-muted-foreground px-1 truncate max-w-[100px]">
            {previewUrl ? "/" : "/"}
          </span>
        </>
      )}
      {tab === "code" && activeFile && (
        <span className="text-xs font-mono text-muted-foreground px-2 truncate max-w-[200px]">{activeFile.path}</span>
      )}
      <div className="flex-1" />
      {tab === "preview" && previewUrl && (
        <a href={previewUrl} target="_blank" rel="noopener noreferrer"
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
      {tab === "preview" && (
        <button onClick={onRefresh} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={onToggleTerminal}
        className={`w-7 h-7 flex items-center justify-center transition-colors duration-150 ${showTerminal ? "text-foreground bg-foreground/8" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}>
        <TerminalSquare className="w-3.5 h-3.5" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="text-xs" asChild><Link href="/dashboard"><Globe className="w-3.5 h-3.5 mr-2" />Dashboard</Link></DropdownMenuItem>
          <DropdownMenuItem className="text-xs" asChild><Link href="/dashboard/deployments"><Layers className="w-3.5 h-3.5 mr-2" />Deployments</Link></DropdownMenuItem>
          <DropdownMenuItem className="text-xs" asChild><Link href="/dashboard/env"><KeyRound className="w-3.5 h-3.5 mr-2" />Environment Variables</Link></DropdownMenuItem>
          <DropdownMenuItem className="text-xs" asChild><Link href="/dashboard/domains"><Link2 className="w-3.5 h-3.5 mr-2" />Domains</Link></DropdownMenuItem>
          <DropdownMenuItem className="text-xs" asChild><Link href="/dashboard/analytics"><BarChart2 className="w-3.5 h-3.5 mr-2" />Analytics</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Terminal ───────────────────────────────────────────────────────────────
function TerminalPanel({ onClose, logs }: { onClose: () => void; logs: string[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  return (
    <div className="border-t border-foreground/10 bg-background flex flex-col shrink-0" style={{ height: 200 }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-3">
          <button className="text-xs font-medium border-b-2 border-foreground pb-0.5">Logs</button>
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <TerminalSquare className="w-3 h-3" />Terminal
          </button>
        </div>
        <div className="flex items-center gap-1">
          <input placeholder="Filter…" className="text-xs bg-foreground/[0.03] border border-foreground/10 px-2 h-5 outline-none w-20 font-mono" />
          <button className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={() => navigator.clipboard.writeText(logs.join("\n"))}>
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={onClose} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2 font-mono text-xs">
        {logs.length === 0 ? (
          <span className="text-muted-foreground/40">No logs yet</span>
        ) : logs.map((line, i) => (
          <div key={i} className={`leading-5 ${line.includes("[ERROR]") ? "text-red-500" : line.includes("✓") ? "text-green-600" : "text-foreground/70"}`}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Database tab ───────────────────────────────────────────────────────────
function DatabaseTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Database className="w-8 h-8 text-muted-foreground/25" />
      <div className="text-center">
        <p className="text-sm font-medium mb-1">No Database Connected</p>
        <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
          Connect a database like Supabase or Upstash to view, search and manage your data, all in Masidy
        </p>
      </div>
      <button className="bg-foreground text-background text-xs font-medium px-4 h-8 hover:bg-foreground/90 transition-colors duration-150">
        Connect Database
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
function BuilderContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("preview");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [showTerminal, setShowTerminal] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Load credits
  useEffect(() => {
    fetch("/api/credits/balance").then(r => r.json()).then(d => setCredits(d.balance ?? null)).catch(() => {});
  }, []);

  // Auto-send prompt from URL
  const initialSent = useRef(false);
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    const initialModel = (searchParams.get("model") as AgentModel) ?? "lite";
    if (prompt && !initialSent.current) {
      initialSent.current = true;
      setModel(initialModel);
      setModelLabel(MODELS.find((m) => m.id === initialModel)?.label ?? "Masidy Lite");
      handleSend(prompt, initialModel);
    }
  }, []);

  const handleSend = useCallback(async (content: string, model: AgentModel) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/builder/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, model }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: "assistant",
          content: `You need more credits to continue. You have ${data.remaining ?? 0} credits remaining.`,
          timestamp: new Date(),
        }]);
        setIsLoading(false);
        return;
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(), role: "assistant",
        content: data.explanation ?? "Done.", files: data.files ?? [], timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh credits
      fetch("/api/credits/balance").then(r => r.json()).then(d => setCredits(d.balance ?? null)).catch(() => {});

      if (data.files?.length > 0) {
        setFiles((prev) => {
          const updated = [...prev];
          for (const f of data.files as FileNode[]) {
            const idx = updated.findIndex((x) => x.path === f.path);
            if (idx >= 0) updated[idx] = f; else updated.push(f);
          }
          return updated;
        });
        setActiveFile(data.files[0]);
        setRightTab("code");
      }
      if (data.preview_url) { setPreviewUrl(data.preview_url); setRightTab("preview"); }
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: "Something went wrong. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
      }]);
    } finally { setIsLoading(false); }
  }, [messages]);

  async function handleDeploy() {
    if (!files.length) return;
    setIsDeploying(true);
    setShowTerminal(true);
    const ts = () => new Date().toISOString().split("T")[1].slice(0, 12);
    setTerminalLogs([`${ts()} [INFO] Starting deployment…`]);
    try {
      const res = await fetch("/api/builder/deploy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, projectName: `masidy-${Date.now()}` }),
      });
      const data = await res.json();
      if (data.url) {
        setPreviewUrl(data.url);
        setRightTab("preview");
        setTerminalLogs(prev => [...prev,
          `${ts()} [INFO] ✓ Build complete`,
          `${ts()} [INFO] ✓ Deployed: ${data.url}`,
        ]);
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: "assistant",
          content: `✓ Deployed!\n\nLive URL: ${data.url}`,
          timestamp: new Date(),
        }]);
      } else {
        setTerminalLogs(prev => [...prev, `${ts()} [ERROR] Deploy failed: ${data.error ?? "Unknown error"}`]);
      }
    } catch {
      setTerminalLogs(prev => [...prev, `${ts()} [ERROR] Deploy failed`]);
    } finally { setIsDeploying(false); }
  }

  function handleFileChange(path: string, content: string) {
    setFiles((prev) => prev.map((f) => f.path === path ? { ...f, content } : f));
    if (activeFile?.path === path) setActiveFile((prev) => prev ? { ...prev, content } : prev);
  }

  const vpWidth = VIEWPORTS.find((v) => v.key === viewport)?.w ?? "100%";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar previewUrl={previewUrl} branch="main" credits={credits} onDeploy={handleDeploy} isDeploying={isDeploying} files={files} />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Chat — resizable */}
        {!chatCollapsed && (
          <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
            <ResizablePanel defaultSize={32} minSize={20} maxSize={55} id="chat-panel">
              <div className="h-full border-r border-foreground/10 overflow-hidden">
                <ChatPanel
                  messages={messages} isLoading={isLoading}
                  onSend={handleSend} credits={credits}
                  onReset={() => { setMessages([]); setFiles([]); setActiveFile(null); setPreviewUrl(null); setTerminalLogs([]); }}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-foreground/5 hover:bg-foreground/15 transition-colors duration-150" />

            {/* RIGHT: Everything else */}
            <ResizablePanel defaultSize={68} minSize={40} id="right-panel">
              <div className="flex flex-col h-full overflow-hidden">
                <RightToolbar
                  tab={rightTab} onTab={setRightTab}
                  chatCollapsed={chatCollapsed} onToggleChat={() => setChatCollapsed(true)}
                  viewport={viewport} onViewport={setViewport}
                  previewUrl={previewUrl} onRefresh={() => setPreviewKey((k) => k + 1)}
                  showTerminal={showTerminal} onToggleTerminal={() => setShowTerminal((v) => !v)}
                  activeFile={activeFile}
                />
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    {rightTab === "preview" && (
                      <div className="h-full flex items-start justify-center bg-foreground/[0.015] overflow-auto">
                        {previewUrl ? (
                          <div className="h-full transition-all duration-300" style={{ width: vpWidth, maxWidth: "100%" }}>
                            <iframe key={previewKey} src={previewUrl} className="w-full h-full border-0"
                              title="Live Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Monitor className="w-8 h-8 text-muted-foreground/20" />
                            <p className="text-xs text-muted-foreground">Preview will appear here</p>
                            <p className="text-[10px] text-muted-foreground/50 font-mono">Ask Masidy to build something to see a live preview</p>
                          </div>
                        )}
                      </div>
                    )}
                    {rightTab === "code" && <CodeEditor file={activeFile} onChange={handleFileChange} />}
                    {rightTab === "files" && (
                      <FileTree files={files} activeFile={activeFile?.path ?? null}
                        onSelect={(f) => { setActiveFile(f); setRightTab("code"); }} />
                    )}
                    {rightTab === "database" && <DatabaseTab />}
                  </div>
                  {showTerminal && <TerminalPanel onClose={() => setShowTerminal(false)} logs={terminalLogs} />}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {/* Chat collapsed — show full right panel with expand button */}
        {chatCollapsed && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <RightToolbar
              tab={rightTab} onTab={setRightTab}
              chatCollapsed={chatCollapsed} onToggleChat={() => setChatCollapsed(false)}
              viewport={viewport} onViewport={setViewport}
              previewUrl={previewUrl} onRefresh={() => setPreviewKey((k) => k + 1)}
              showTerminal={showTerminal} onToggleTerminal={() => setShowTerminal((v) => !v)}
              activeFile={activeFile}
            />
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                {rightTab === "preview" && (
                  <div className="h-full flex items-start justify-center bg-foreground/[0.015] overflow-auto">
                    {previewUrl ? (
                      <div className="h-full transition-all duration-300" style={{ width: vpWidth, maxWidth: "100%" }}>
                        <iframe key={previewKey} src={previewUrl} className="w-full h-full border-0"
                          title="Live Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Monitor className="w-8 h-8 text-muted-foreground/20" />
                        <p className="text-xs text-muted-foreground">Preview will appear here</p>
                      </div>
                    )}
                  </div>
                )}
                {rightTab === "code" && <CodeEditor file={activeFile} onChange={handleFileChange} />}
                {rightTab === "files" && (
                  <FileTree files={files} activeFile={activeFile?.path ?? null}
                    onSelect={(f) => { setActiveFile(f); setRightTab("code"); }} />
                )}
                {rightTab === "database" && <DatabaseTab />}
              </div>
              {showTerminal && <TerminalPanel onClose={() => setShowTerminal(false)} logs={terminalLogs} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex gap-1">
          {[0,1,2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}

