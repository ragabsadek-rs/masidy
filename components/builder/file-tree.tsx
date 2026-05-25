"use client";

import { useState } from "react";
import {
  ChevronRight,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileNode {
  path: string;
  content: string;
  language: string;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: FileNode;
}

function buildTree(files: FileNode[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        current = existing.children;
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(node);
        current = node.children;
      }
    }
  }

  return root;
}

function getFileIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  if (name.endsWith(".css")) return <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
  if (name.endsWith(".json")) return <FileCode className="w-3.5 h-3.5 text-yellow-500 shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

function TreeNodeItem({
  node,
  depth,
  activeFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeFile: string | null;
  onSelect: (file: FileNode) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 w-full px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-100"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform duration-150", open && "rotate-90")} />
          {open
            ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            : <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          }
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children.map((child) => (
          <TreeNodeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  const isActive = activeFile === node.path;

  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      className={cn(
        "flex items-center gap-1.5 w-full px-2 py-0.5 text-xs transition-colors duration-100",
        isActive
          ? "bg-foreground/8 text-foreground border-l-2 border-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({
  files,
  activeFile,
  onSelect,
}: {
  files: FileNode[];
  activeFile: string | null;
  onSelect: (file: FileNode) => void;
}) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <Folder className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">No files yet</p>
        <p className="text-[10px] text-muted-foreground/60">Ask Masidy to build something</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-foreground/10 shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Files</span>
        <span className="text-[10px] font-mono text-muted-foreground">{files.length}</span>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            depth={0}
            activeFile={activeFile}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
