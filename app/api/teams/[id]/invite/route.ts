import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inviteMember } from "@/lib/teams";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify requester is owner or admin
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .single();

  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { email } = body as { email?: string };
  if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const invite = await inviteMember(id, email.trim(), user.id);

  // Send invite email (fire-and-forget via Resend if configured)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const acceptUrl = `${appUrl}/team/accept?token=${invite.token}`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Masidy <noreply@masidy.dev>",
      to: email.trim(),
      subject: "You've been invited to a team on Masidy",
      html: `<p>You've been invited to join a team on Masidy.</p><p><a href="${acceptUrl}">Accept invitation</a></p>`,
    });
  } catch {
    // Email failure is non-blocking
  }

  return NextResponse.json({ success: true, acceptUrl });
}
