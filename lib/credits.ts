import { createAdminClient } from "@/lib/supabase/server";
import { CREDIT_COSTS, type CreditAction } from "@/lib/stripe";
import { deductTeamCredits } from "@/lib/teams";

export async function getCredits(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .single();
  return data?.balance ?? 0;
}

export async function deductCredits(
  userId: string,
  action: CreditAction,
  description: string,
  teamId?: string
): Promise<{ success: boolean; remaining: number; error?: string }> {
  // When a teamId is provided, deduct from team credits instead of individual credits
  if (teamId) {
    return deductTeamCredits(teamId, action, description);
  }

  const supabase = createAdminClient();
  const cost = CREDIT_COSTS[action];

  const { data: creditRow } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const balance = creditRow?.balance ?? 0;

  if (balance < cost) {
    return { success: false, remaining: balance, error: "Insufficient credits" };
  }

  const newBalance = Number(balance) - cost;

  await supabase
    .from("credits")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    action,
    amount: -cost,
    description,
    balance_after: newBalance,
  });

  return { success: true, remaining: newBalance };
}

export async function addCredits(
  userId: string,
  amount: number,
  description: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data: creditRow } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const current = creditRow?.balance ?? 0;
  const newBalance = Number(current) + amount;

  await supabase
    .from("credits")
    .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() });

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    action: "purchase",
    amount,
    description,
    balance_after: newBalance,
  });

  return newBalance;
}
