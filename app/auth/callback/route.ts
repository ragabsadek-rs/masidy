import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Give new users 10 free credits
      const { data: existing } = await supabase
        .from("credits")
        .select("user_id")
        .eq("user_id", data.user.id)
        .single();

      if (!existing) {
        await supabase.from("credits").insert({
          user_id: data.user.id,
          balance: 10,
        });
        await supabase.from("credit_transactions").insert({
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
