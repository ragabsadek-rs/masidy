"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

interface Message {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  created_at: string;
  session_id?: string | null;
  conversation_id?: string | null;
}

interface Session {
  id: string;
  firstMessage: string;
  lastMessage: string;
  lastTimestamp: string;
  messageCount: number;
  role: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function truncate(text: string, max = 80): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
}

function groupIntoSessions(messages: Message[]): Session[] {
  // Group by session_id or conversation_id if available, otherwise treat each message as its own entry
  const grouped = new Map<string, Message[]>();

  for (const msg of messages) {
    const key = msg.session_id ?? msg.conversation_id ?? msg.id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(msg);
  }

  const sessions: Session[] = [];

  for (const [key, msgs] of grouped.entries()) {
    // Sort messages within session by created_at ascending
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    sessions.push({
      id: key,
      firstMessage: truncate(first.content),
      lastMessage: truncate(last.content),
      lastTimestamp: last.created_at,
      messageCount: sorted.length,
      role: first.role,
    });
  }

  // Sort sessions by most recent last message
  sessions.sort(
    (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
  );

  return sessions;
}

export default function AgentSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: sbError } = await (supabase as any)
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (sbError) {
          // Table may not exist yet — show empty state gracefully
          setSessions([]);
        } else {
          setSessions(groupIntoSessions((data as Message[]) ?? []));
        }
      } catch {
        setError("Could not connect to Supabase.");
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Chat History</h1>
        {!loading && !error && (
          <span className="text-xs font-mono text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl">
        {/* Loading skeleton */}
        {loading && (
          <div className="border border-foreground/10">
            <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
              <div className="h-3 w-24 animate-pulse bg-foreground/10" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`px-4 py-4 flex flex-col gap-2 ${i < 4 ? "border-b border-foreground/10" : ""}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="h-3 w-48 animate-pulse bg-foreground/10" />
                  <div className="h-3 w-16 animate-pulse bg-foreground/10" />
                </div>
                <div className="h-3 w-full animate-pulse bg-foreground/10" />
                <div className="h-3 w-2/3 animate-pulse bg-foreground/10" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="border border-foreground/10 px-4 py-16 flex flex-col items-center gap-4 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">Unable to load sessions</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sessions.length === 0 && (
          <div className="border border-foreground/10 px-4 py-16 flex flex-col items-center gap-4 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No chat history yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Start a conversation with an AI agent and your sessions will appear here.
              </p>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {!loading && !error && sessions.length > 0 && (
          <div className="border border-foreground/10">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02]">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Session
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-right">
                Time
              </span>
            </div>

            {sessions.map((session, i) => (
              <div
                key={session.id}
                className={`px-4 py-4 hover:bg-foreground/[0.02] transition-colors duration-150 ${
                  i < sessions.length - 1 ? "border-b border-foreground/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: message preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 shrink-0 ${
                          session.role === "assistant"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-foreground/5 text-muted-foreground"
                        }`}
                      >
                        {session.role === "assistant" ? "ai" : "user"}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug truncate">
                      {session.firstMessage || <span className="text-muted-foreground italic">Empty message</span>}
                    </p>
                    {session.messageCount > 1 && session.lastMessage !== session.firstMessage && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        ↳ {session.lastMessage}
                      </p>
                    )}
                  </div>

                  {/* Right: timestamp */}
                  <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">
                    {formatTimestamp(session.lastTimestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
