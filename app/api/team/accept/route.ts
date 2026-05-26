import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/lib/teams";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { token } = body as { token?: string };
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 });

  try {
    await acceptInvite(token, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid or expired invite";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
