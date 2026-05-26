import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTeam } from "@/lib/teams";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name } = body as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Team name is required" }, { status: 400 });

  const team = await createTeam(user.id, name.trim());
  return NextResponse.json(team, { status: 201 });
}
