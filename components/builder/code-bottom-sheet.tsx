"use client";

import { X } from "lucide-react";
import { FileTree, FileNode } from "@/components/builder/file-tree";
import { CodeEditor } from "@/components/builder/code-editor";

interface CodeBottomSheetProps {
  open: boolean;
  onClose: () => void;
  files: FileNode[];
  activeFile: FileNode | null;
  onSelect: (f: FileNode) => void;
  onChange: (path: string, content: string) => void;
}

export function CodeBottomSheet({ open, onClose, files, activeFile, onSelect, onChange }: CodeBottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 bg-background border-t border-foreground/10 flex flex-col" style={{ height: "75vh" }}>
        {/* Handle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 shrink-0">
          <span className="text-xs font-mono text-muted-foreground">{activeFile?.path ?? "Files"}</span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-150">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-40 border-r border-foreground/10 overflow-auto shrink-0">
            <FileTree files={files} activeFile={activeFile?.path ?? null} onSelect={(f) => { onSelect(f); }} />
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor file={activeFile} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
