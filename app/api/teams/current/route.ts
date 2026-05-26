import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTeamForUser, getTeamMembers } from "@/lib/teams";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await getTeamForUser(user.id);
  if (!team) return NextResponse.json({ team: null, userId: user.id });

  const members = await getTeamMembers(team.id);
  return NextResponse.json({ team, members, userId: user.id });
}
