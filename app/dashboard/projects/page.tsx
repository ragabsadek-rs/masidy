"use client";

import { useEffect, useState, useRef } from "react";
import { FolderOpen, Plus, Trash2, Pencil, Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

interface Project { id: string; name: string; files: unknown[]; updated_at: string; created_at: string; }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  function fetchProjects() {
    setLoading(true);
    fetch("/api/projects").then(r => r.json()).then(d => {
      setProjects(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { fetchProjects(); }, []);

  function startRename(p: Project) {
    setRenamingId(p.id);
    setRenameValue(p.name);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  }

  async function commitRename(id: string) {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: renameValue.trim() } : p));
    setRenamingId(null);
    toast({ title: "Project renamed" });
  }

  async function deleteProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id));
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      fetchProjects();
      toast({ title: "Failed to delete project", variant: "destructive" });
    } else {
      toast({ title: "Project deleted" });
    }
  }

  async function createProject() {
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Untitled Project — ${new Date().toLocaleDateString()}` }),
    });
    const data = await res.json();
    if (data?.id) router.push(`/builder?projectId=${data.id}`);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Toaster />
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Projects</h1>
        <button onClick={createProject}
          className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300">
          <Plus className="w-3.5 h-3.5" />New Project
        </button>
      </div>

      <div className="flex-1 px-6 py-6 max-w-4xl">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-foreground/10 p-5 flex items-center gap-4">
                <div className="h-4 w-48 animate-pulse bg-foreground/10" />
                <div className="h-3 w-24 animate-pulse bg-foreground/10 ml-auto" />
                <div className="h-8 w-20 animate-pulse bg-foreground/10" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium mb-1">No projects yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">Create your first project to start building with Masidy AI.</p>
            </div>
            <button onClick={createProject}
              className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-6 h-9 rounded-full hover:bg-foreground/80 transition-colors duration-300">
              <Plus className="w-3.5 h-3.5" />Create your first project
            </button>
          </div>
        ) : (
          <div className="border border-foreground/10">
            {projects.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-foreground/[0.02] transition-colors duration-150 ${i < projects.length - 1 ? "border-b border-foreground/10" : ""}`}>
                <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  {renamingId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input ref={renameInputRef} value={renameValue} onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") commitRename(p.id); if (e.key === "Escape") setRenamingId(null); }}
                        className="text-sm border-b border-foreground/30 bg-transparent outline-none flex-1" />
                      <button onClick={() => commitRename(p.id)} className="text-muted-foreground hover:text-foreground"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setRenamingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium truncate">{p.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{(p.files as unknown[]).length} files · updated {timeAgo(p.updated_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startRename(p)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background border border-foreground/10 rounded-none max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-medium">Delete project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                          This will permanently delete <span className="font-mono text-foreground">{p.name}</span> and all its messages.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 px-5 rounded-full border-foreground/10 text-sm">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteProject(p.id)} className="h-9 px-5 rounded-full bg-foreground text-background text-sm">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Link href={`/builder?projectId=${p.id}`}
                    className="flex items-center gap-1.5 bg-foreground text-background text-xs font-medium px-4 h-8 rounded-full hover:bg-foreground/80 transition-colors duration-300 ml-1">
                    Open <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
