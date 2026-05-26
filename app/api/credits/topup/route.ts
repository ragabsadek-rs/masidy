import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addCredits } from "@/lib/credits";

// Daily free credit top-up — gives users 10 free credits once per day
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check last top-up
  const { data: lastTopup } = await supabase
    .from("credit_transactions")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("action", "daily_topup")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastTopup) {
    const lastTime = new Date(lastTopup.created_at).getTime();
    const hoursSince = (Date.now() - lastTime) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return NextResponse.json({
        error: "Already claimed today",
        nextIn: Math.ceil(24 - hoursSince),
      }, { status: 429 });
    }
  }

  const newBalance = await addCredits(user.id, 10, "Daily login bonus — 10 free credits");
  return NextResponse.json({ balance: newBalance, added: 10 });
}
