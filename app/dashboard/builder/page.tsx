"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChatPanel, Message } from "@/components/builder/chat-panel";
import { FileTree, FileNode } from "@/components/builder/file-tree";
import { CodeEditor } from "@/components/builder/code-editor";
import { PreviewPanel } from "@/components/builder/preview-panel";
import {
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  GitBranch,
  Rocket,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";

type AgentModel = "lite" | "standard" | "opus";

function BuilderContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);

  // Send message to Masidy agent
  const handleSend = useCallback(async (content: string, model: AgentModel) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/builder/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, model }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.explanation ?? "Done.",
        files: data.files ?? [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Merge new/updated files
      if (data.files && data.files.length > 0) {
        setFiles((prev) => {
          const updated = [...prev];
          for (const newFile of data.files as FileNode[]) {
            const idx = updated.findIndex((f) => f.path === newFile.path);
            if (idx >= 0) {
              updated[idx] = newFile;
            } else {
              updated.push(newFile);
            }
          }
          return updated;
        });

        // Auto-select first new file
        setActiveFile(data.files[0]);
        setShowFileTree(true);
      }

      if (data.preview_url) {
        setPreviewUrl(data.preview_url);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong. Please check your API key in environment variables and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  function handleFileChange(path: string, content: string) {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content } : f))
    );
    if (activeFile?.path === path) {
      setActiveFile((prev) => prev ? { ...prev, content } : prev);
    }
  }

  function handleReset() {
    setMessages([]);
    setFiles([]);
    setActiveFile(null);
    setPreviewUrl(null);
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-foreground/10 shrink-0 bg-background z-10">
        {/* Left */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div className="w-px h-4 bg-foreground/10" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
              <span className="text-background text-[8px] font-mono">M</span>
            </div>
            <span className="text-xs font-medium">masidy<span className="text-blue-500">.</span></span>
          </div>
          <div className="w-px h-4 bg-foreground/10" />
          <span className="text-xs text-muted-foreground font-mono">builder</span>
        </div>

        {/* Center — branch info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
          {files.length > 0 && (
            <>
              <span className="text-foreground/20">·</span>
              <span className="text-foreground/60">{files.length} file{files.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 h-6 rounded-full hover:bg-foreground/80 transition-colors duration-150"
            >
              <Rocket className="w-3 h-3" />
              Visit
            </a>
          )}
          <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">

          {/* Panel 1: Chat */}
          <ResizablePanel defaultSize={25} minSize={18} maxSize={40} id="chat">
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSend={handleSend}
              onReset={handleReset}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Panel 2: File tree + Code editor */}
          <ResizablePanel defaultSize={40} minSize={25} id="editor">
            <ResizablePanelGroup direction="horizontal" className="h-full">

              {/* File tree — toggleable */}
              {showFileTree && (
                <>
                  <ResizablePanel defaultSize={28} minSize={15} maxSize={45} id="filetree">
                    <div className="h-full border-r border-foreground/10 relative">
                      <FileTree
                        files={files}
                        activeFile={activeFile?.path ?? null}
                        onSelect={(f) => setActiveFile(f)}
                      />
                      <button
                        onClick={() => setShowFileTree(false)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors duration-150"
                        title="Hide file tree"
                      >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />
                </>
              )}

              {/* Code editor */}
              <ResizablePanel defaultSize={showFileTree ? 72 : 100} minSize={40} id="code">
                <div className="h-full relative">
                  {!showFileTree && (
                    <button
                      onClick={() => setShowFileTree(true)}
                      className="absolute top-2 left-2 z-10 text-muted-foreground hover:text-foreground transition-colors duration-150"
                      title="Show file tree"
                    >
                      <PanelLeftOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <CodeEditor
                    file={activeFile}
                    onChange={handleFileChange}
                  />
                </div>
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Panel 3: Live preview */}
          <ResizablePanel defaultSize={35} minSize={20} id="preview">
            <PreviewPanel
              files={files}
              previewUrl={previewUrl}
              isBuilding={isBuilding}
            />
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
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
