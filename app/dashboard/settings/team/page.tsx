"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const dynamic = "force-dynamic";

interface Team { id: string; name: string; owner_id: string; }
interface Member { id: string; user_id: string; role: string; joined_at: string; }

export default function TeamSettingsPage() {
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    fetch("/api/credits/balance").then(r => r.json()).catch(() => {});
    // Try to find user's team by checking team_members
    fetch("/api/teams/current").then(r => r.json()).then(d => {
      if (d?.team) {
        setTeam(d.team);
        setMembers(d.members ?? []);
        setTeamId(d.team.id);
        setUserId(d.userId);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/teams", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setTeam(data);
      setTeamId(data.id);
      setMembers([{ id: "owner", user_id: data.owner_id, role: "owner", joined_at: data.created_at }]);
      toast({ title: "Team created" });
    } else {
      toast({ title: data.error ?? "Failed to create team", variant: "destructive" });
    }
    setCreating(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !teamId) return;
    setInviting(true);
    const res = await fetch(`/api/teams/${teamId}/invite`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "Invitation sent", description: `Invite sent to ${inviteEmail.trim()}` });
      setInviteEmail("");
    } else {
      toast({ title: data.error ?? "Failed to send invite", variant: "destructive" });
    }
    setInviting(false);
  }

  async function handleDeleteTeam() {
    if (!teamId) return;
    const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    if (res.ok) {
      setTeam(null); setMembers([]); setTeamId(null);
      toast({ title: "Team deleted" });
    } else {
      toast({ title: "Failed to delete team", variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Toaster />
      <div className="flex items-center justify-between px-6 py-3 border-b border-foreground/10 shrink-0">
        <h1 className="text-sm font-medium">Team Settings</h1>
        <Users className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 px-6 py-6 max-w-2xl">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-foreground/10" />)}
          </div>
        ) : !team ? (
          <div>
            <p className="text-sm text-muted-foreground mb-6">You are not part of a team yet. Create one to collaborate with others.</p>
            <form onSubmit={handleCreateTeam} className="border border-foreground/10 p-5">
              <p className="text-sm font-medium mb-4">Create a Team</p>
              <div className="flex gap-3">
                <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name"
                  className="flex-1 h-9 px-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150" />
                <button type="submit" disabled={creating || !teamName.trim()}
                  className="bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50">
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="border border-foreground/10 p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Team</p>
              <p className="text-xl font-display">{team.name}</p>
            </div>

            <div className="border border-foreground/10">
              <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02] flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Members ({members.length})</span>
              </div>
              {members.map((m, i) => (
                <div key={m.id} className={`flex items-center gap-4 px-4 py-3 ${i < members.length - 1 ? "border-b border-foreground/10" : ""}`}>
                  <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center shrink-0">
                    <span className="text-background text-[10px] font-mono">?</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{m.user_id.slice(0, 8)}…</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 ${m.role === "owner" ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground"}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleInvite} className="border border-foreground/10 p-5">
              <p className="text-sm font-medium mb-4">Invite Member</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com"
                    className="w-full h-9 pl-9 pr-3 text-sm border border-foreground/15 bg-background outline-none focus:border-foreground/40 transition-colors duration-150" />
                </div>
                <button type="submit" disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 h-9 rounded-full hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" />{inviting ? "Sending…" : "Invite"}
                </button>
              </div>
            </form>

            {userId === team.owner_id && (
              <div className="border border-red-500/20 p-5">
                <p className="text-sm font-medium mb-2 text-red-600">Danger Zone</p>
                <p className="text-xs text-muted-foreground mb-4">Deleting the team is permanent and cannot be undone.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 border border-red-500/30 text-red-600 text-sm px-4 h-9 hover:bg-red-500/5 transition-colors duration-150">
                      <Trash2 className="w-3.5 h-3.5" />Delete Team
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background border border-foreground/10 rounded-none max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete team?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm text-muted-foreground">This will permanently delete the team and remove all members.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="h-9 px-5 rounded-full border-foreground/10 text-sm">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteTeam} className="h-9 px-5 rounded-full bg-foreground text-background text-sm">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
