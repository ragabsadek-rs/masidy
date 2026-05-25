import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user already has credits (idempotent)
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("credits")
        .select("user_id")
        .eq("user_id", data.user.id)
        .single();

      if (!existing) {
        // New user — give 10 free credits
        await admin.from("credits").insert({
          user_id: data.user.id,
          balance: 10,
        });
        await admin.from("credit_transactions").insert({
          user_id: data.user.id,
          action: "signup_bonus",
          amount: 10,
          description: "Welcome bonus — 10 free credits",
          balance_after: 10,
        });
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
