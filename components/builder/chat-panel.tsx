"use client";

import { useRef, useEffect, useState } from "react";
import {
  ArrowUp,
  Paperclip,
  Sparkles,
  User,
  ChevronDown,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { FileNode } from "./file-tree";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: FileNode[];
  timestamp: Date;
}

type AgentModel = "lite" | "standard" | "opus";

const AGENTS: Record<AgentModel, { label: string; desc: string; color: string }> = {
  lite:     { label: "Masidy Lite",     desc: "Fast · claude-haiku",   color: "text-green-500" },
  standard: { label: "Masidy Standard", desc: "Balanced · claude-sonnet", color: "text-blue-500" },
  opus:     { label: "Masidy",          desc: "Powerful · claude-opus",  color: "text-purple-500" },
};

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] bg-foreground text-background rounded-2xl rounded-br-sm px-4 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 mb-4 group">
      <div className="w-6 h-6 rounded-full bg-foreground/8 border border-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3 h-3 text-foreground/60" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl rounded-bl-sm px-4 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{msg.content}</p>
          {msg.files && msg.files.length > 0 && (
            <div className="mt-2 pt-2 border-t border-foreground/10 flex flex-wrap gap-1.5">
              {msg.files.map((f) => (
                <span
                  key={f.path}
                  className="text-[10px] font-mono bg-foreground/8 border border-foreground/10 px-2 py-0.5 text-muted-foreground"
                >
                  {f.path}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 mb-4">
      <div className="w-6 h-6 rounded-full bg-foreground/8 border border-foreground/10 flex items-center justify-center shrink-0">
        <Sparkles className="w-3 h-3 text-foreground/60" />
      </div>
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (content: string, model: AgentModel) => void;
  onReset: () => void;
}

export function ChatPanel({ messages, isLoading, onSend, onReset }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<AgentModel>("lite");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, model);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const agent = AGENTS[model];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-background text-[9px] font-mono font-medium">M</span>
          </div>
          <span className="text-sm font-medium">masidy<span className="text-blue-500">.</span></span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
              title="New chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">What do you want to build?</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Describe your app and Masidy will write the code, set up files, and deploy it live.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[260px]">
              {[
                "Build a SaaS dashboard with auth",
                "Create a REST API with Next.js",
                "Make a landing page for my startup",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs text-left px-3 py-2 border border-foreground/10 hover:border-foreground/25 hover:bg-foreground/5 transition-all duration-150 text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <div className="border border-foreground/10 rounded-2xl bg-background overflow-hidden focus-within:border-foreground/25 transition-colors duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build…"
            rows={1}
            className="w-full px-4 pt-3 pb-2 text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
            style={{ minHeight: 44, maxHeight: 160 }}
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            {/* Model picker */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  model === "lite" ? "bg-green-500" : model === "opus" ? "bg-purple-500" : "bg-blue-500"
                }`} />
                {agent.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showModelPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-52 border border-foreground/10 bg-background shadow-lg z-50">
                  {(Object.entries(AGENTS) as [AgentModel, typeof AGENTS[AgentModel]][]).map(([key, a]) => (
                    <button
                      key={key}
                      onClick={() => { setModel(key); setShowModelPicker(false); }}
                      className={`flex items-start gap-2.5 w-full px-3 py-2.5 text-left hover:bg-foreground/5 transition-colors duration-150 ${
                        model === key ? "bg-foreground/5" : ""
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        key === "lite" ? "bg-green-500" : key === "opus" ? "bg-purple-500" : "bg-blue-500"
                      }`} />
                      <div>
                        <p className="text-xs font-medium">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{a.desc}</p>
                      </div>
                      {model === key && <Check className="w-3 h-3 ml-auto mt-0.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-7 h-7 bg-foreground text-background rounded-full disabled:opacity-30 hover:bg-foreground/80 transition-all duration-150"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
