import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { CREDIT_COSTS, type CreditAction } from "@/lib/stripe";

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  token: string;
  invited_by: string;
  accepted_at: string | null;
  created_at: string;
}

/**
 * Create a new team, add the creator as owner, and initialise team_credits with balance=0.
 */
export async function createTeam(userId: string, name: string): Promise<Team> {
  const supabase = createAdminClient();

  // Insert the team row
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name, owner_id: userId })
    .select()
    .single();

  if (teamError || !team) {
    throw new Error(`Failed to create team: ${teamError?.message}`);
  }

  // Add the creator as owner in team_members
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    throw new Error(`Failed to add team owner: ${memberError.message}`);
  }

  // Initialise team_credits with balance=0
  const { error: creditsError } = await supabase.from("team_credits").insert({
    team_id: team.id,
    balance: 0,
  });

  if (creditsError) {
    throw new Error(`Failed to initialise team credits: ${creditsError.message}`);
  }

  return team as Team;
}

/**
 * Find the team that the given user belongs to (as any role).
 * Returns null if the user is not a member of any team.
 */
export async function getTeamForUser(userId: string): Promise<Team | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("teams(*)")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error || !data) return null;

  // Supabase returns the joined row under the relation name
  const team = (data as unknown as { teams: Team }).teams;
  return team ?? null;
}

/**
 * Return all members of a team.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId);

  if (error) {
    throw new Error(`Failed to get team members: ${error.message}`);
  }

  return (data ?? []) as TeamMember[];
}

/**
 * Generate a secure invite token and insert a team_invites row.
 */
export async function inviteMember(
  teamId: string,
  email: string,
  invitedBy: string
): Promise<TeamInvite> {
  const supabase = createAdminClient();

  const token = randomBytes(32).toString("hex");

  const { data, error } = await supabase
    .from("team_invites")
    .insert({
      team_id: teamId,
      email,
      token,
      invited_by: invitedBy,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create invite: ${error?.message}`);
  }

  return data as TeamInvite;
}

/**
 * Accept an invite by token: insert the user as a member and mark the invite accepted.
 */
export async function acceptInvite(token: string, userId: string): Promise<void> {
  const supabase = createAdminClient();

  // Look up the invite
  const { data: invite, error: inviteError } = await supabase
    .from("team_invites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (inviteError || !invite) {
    throw new Error("Invite not found or already accepted");
  }

  // Add the user as a member
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: invite.team_id,
    user_id: userId,
    role: "member",
  });

  if (memberError) {
    throw new Error(`Failed to add team member: ${memberError.message}`);
  }

  // Mark the invite as accepted
  const { error: updateError } = await supabase
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateError) {
    throw new Error(`Failed to mark invite accepted: ${updateError.message}`);
  }
}

/**
 * Delete a team. ON DELETE CASCADE handles team_members, team_invites, and team_credits.
 * Projects have team_id set to NULL via ON DELETE SET NULL.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    throw new Error(`Failed to delete team: ${error.message}`);
  }
}

/**
 * Return the current credit balance for a team.
 */
export async function getTeamCredits(teamId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("team_credits")
    .select("balance")
    .eq("team_id", teamId)
    .single();

  if (error || !data) return 0;

  return data.balance ?? 0;
}

/**
 * Deduct credits from a team's balance.
 * If the balance is insufficient, returns { success: false, remaining: balance }.
 * On success, updates team_credits and inserts a credit_transactions row.
 */
export async function deductTeamCredits(
  teamId: string,
  action: CreditAction,
  description: string
): Promise<{ success: boolean; remaining: number }> {
  const supabase = createAdminClient();
  const cost = CREDIT_COSTS[action];

  const { data: creditRow } = await supabase
    .from("team_credits")
    .select("balance")
    .eq("team_id", teamId)
    .single();

  const balance = creditRow?.balance ?? 0;

  if (balance < cost) {
    return { success: false, remaining: balance };
  }

  const newBalance = Number(balance) - cost;

  await supabase
    .from("team_credits")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("team_id", teamId);

  await supabase.from("credit_transactions").insert({
    team_id: teamId,
    action,
    amount: -cost,
    description,
    balance_after: newBalance,
  });

  return { success: true, remaining: newBalance };
}
