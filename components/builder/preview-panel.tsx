"use client";

import { useState, useRef, useEffect } from "react";
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Code2,
  Eye,
} from "lucide-react";
import { FileNode } from "./file-tree";

interface PreviewPanelProps {
  files: FileNode[];
  previewUrl: string | null;
  isBuilding: boolean;
}

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: Record<Viewport, { width: string; label: string; icon: React.ReactNode }> = {
  desktop: { width: "100%", label: "Desktop", icon: <Monitor className="w-3.5 h-3.5" /> },
  tablet:  { width: "768px", label: "Tablet",  icon: <Tablet className="w-3.5 h-3.5" /> },
  mobile:  { width: "375px", label: "Mobile",  icon: <Smartphone className="w-3.5 h-3.5" /> },
};

function buildPreviewHtml(files: FileNode[]): string {
  // Find the main component file
  const mainFile = files.find(
    (f) => f.path === "app/page.tsx" || f.path === "page.tsx" || f.path === "index.tsx" || f.path === "App.tsx"
  ) ?? files[0];

  if (!mainFile) return "";

  // Build a simple HTML preview for non-React files
  const cssFile = files.find((f) => f.path.endsWith(".css"));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${cssFile ? `<style>${cssFile.content}</style>` : ""}
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    .preview-note { 
      position: fixed; bottom: 8px; right: 8px; 
      background: rgba(0,0,0,0.6); color: white; 
      font-size: 10px; padding: 4px 8px; border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div class="preview-note">Live Preview</div>
</body>
</html>`;
}

export function PreviewPanel({ files, previewUrl, isBuilding }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const displayUrl = previewUrl ?? "about:blank";

  function refresh() {
    setKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-foreground/10 shrink-0">
        {/* Tab toggle */}
        <div className="flex items-center border border-foreground/10">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors duration-150 ${
              activeTab === "preview"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors duration-150 ${
              activeTab === "code"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="w-3 h-3" />
            Code
          </button>
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-1.5 bg-foreground/[0.03] border border-foreground/10 px-2.5 h-7 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${previewUrl ? "bg-green-500" : "bg-foreground/20"}`} />
          <span className="text-xs font-mono text-muted-foreground truncate">
            {previewUrl ?? "waiting for deployment…"}
          </span>
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center border border-foreground/10">
          {(Object.entries(VIEWPORTS) as [Viewport, typeof VIEWPORTS[Viewport]][]).map(([key, vp]) => (
            <button
              key={key}
              onClick={() => setViewport(key)}
              title={vp.label}
              className={`flex items-center justify-center w-7 h-7 transition-colors duration-150 ${
                viewport === key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {vp.icon}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={refresh}
          className="flex items-center justify-center w-7 h-7 border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors duration-150"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-7 h-7 border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors duration-150"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden bg-foreground/[0.02] flex items-start justify-center">
        {isBuilding ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-mono">Building…</p>
          </div>
        ) : previewUrl ? (
          <div
            className="h-full transition-all duration-300 overflow-hidden"
            style={{ width: VIEWPORTS[viewport].width, maxWidth: "100%" }}
          >
            <iframe
              key={key}
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 border border-foreground/10 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground">Preview will appear here</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">
              Ask Masidy to build something to see a live preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
