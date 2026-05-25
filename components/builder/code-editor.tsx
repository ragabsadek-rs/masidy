"use client";

import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { FileNode } from "./file-tree";

interface CodeEditorProps {
  file: FileNode | null;
  onChange: (path: string, content: string) => void;
}

const LANG_MAP: Record<string, string> = {
  tsx: "typescript",
  ts: "typescript",
  jsx: "javascript",
  js: "javascript",
  css: "css",
  json: "json",
  md: "markdown",
  html: "html",
  py: "python",
  sh: "shell",
};

function getLanguage(path: string): string {
  const ext = path.split(".").pop() ?? "";
  return LANG_MAP[ext] ?? "plaintext";
}

export function CodeEditor({ file, onChange }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (ed) => {
    editorRef.current = ed;
    // TypeScript config
    // @ts-ignore
    if (window.monaco) {
      // @ts-ignore
      window.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: 4, // React JSX
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
      });
    }
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-background">
        <div className="w-12 h-12 border border-foreground/10 flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground/40">{"</>"}</span>
        </div>
        <p className="text-xs text-muted-foreground">Select a file to edit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b border-foreground/10 bg-foreground/[0.02] shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-1.5 border-b-2 border-foreground bg-background">
          <span className="text-xs font-mono text-foreground truncate max-w-[160px]">
            {file.path.split("/").pop()}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getLanguage(file.path)}
          value={file.content}
          theme="vs-light"
          onMount={handleMount}
          onChange={(val) => {
            if (val !== undefined) onChange(file.path, val);
          }}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            renderLineHighlight: "line",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            padding: { top: 16, bottom: 16 },
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderLineHighlightOnlyWhenFocus: true,
          }}
        />
      </div>
    </div>
  );
}
