import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/server";

export type GatewayProvider = "anthropic" | "openai" | "gemini";
export type GatewayStatus =
  | "success"
  | "auth_error"
  | "credit_error"
  | "rate_limited"
  | "provider_error";

export interface GatewayKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

/**
 * Generate a new msk_ prefixed API key, store only the bcrypt hash,
 * and return the plaintext key once.
 */
export async function createGatewayKey(
  userId: string,
  name: string
): Promise<{ key: string; record: Omit<GatewayKey, "key_hash"> }> {
  const plaintext = `msk_${randomBytes(32).toString("hex")}`;
  const key_prefix = plaintext.slice(4, 12); // 8 chars after "msk_"
  const key_hash = await bcrypt.hash(plaintext, 10);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("gateway_keys")
    .insert({ user_id: userId, name, key_hash, key_prefix })
    .select("id, user_id, name, key_prefix, created_at, last_used_at, revoked_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create gateway key: ${error?.message}`);
  }

  return { key: plaintext, record: data as Omit<GatewayKey, "key_hash"> };
}

/**
 * Validate a plaintext gateway key from an Authorization header.
 * Uses prefix-based lookup then bcrypt comparison.
 * Returns the key record or null if invalid/revoked.
 */
export async function validateGatewayKey(
  plaintext: string
): Promise<GatewayKey | null> {
  if (!plaintext.startsWith("msk_") || plaintext.length < 12) return null;

  const prefix = plaintext.slice(4, 12);
  const supabase = createAdminClient();

  const { data: candidates } = await supabase
    .from("gateway_keys")
    .select("*")
    .eq("key_prefix", prefix)
    .is("revoked_at", null);

  if (!candidates || candidates.length === 0) return null;

  for (const candidate of candidates as GatewayKey[]) {
    const match = await bcrypt.compare(plaintext, candidate.key_hash);
    if (match) {
      // Update last_used_at (fire-and-forget)
      void supabase
        .from("gateway_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", candidate.id);
      return candidate;
    }
  }

  return null;
}

/**
 * Revoke a gateway key by setting revoked_at.
 */
export async function revokeGatewayKey(
  keyId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("gateway_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to revoke gateway key: ${error.message}`);
}

/**
 * List all gateway keys for a user — never returns key_hash.
 */
export async function listGatewayKeys(
  userId: string
): Promise<Omit<GatewayKey, "key_hash">[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("gateway_keys")
    .select("id, user_id, name, key_prefix, created_at, last_used_at, revoked_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list gateway keys: ${error.message}`);
  return (data ?? []) as Omit<GatewayKey, "key_hash">[];
}

/**
 * Record a gateway usage row. Wrapped in try/catch — never throws.
 */
export async function recordGatewayUsage(params: {
  keyId: string;
  userId: string;
  provider: GatewayProvider;
  model: string;
  creditsUsed: number;
  status: GatewayStatus;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("gateway_usage").insert({
      key_id: params.keyId,
      user_id: params.userId,
      provider: params.provider,
      model: params.model,
      credits_used: params.creditsUsed,
      status: params.status,
    });
  } catch {
    // Intentionally swallowed — usage logging must never break the caller
  }
}

/**
 * Get usage grouped by provider + model for the dashboard.
 */
export async function getGatewayUsageSummary(
  userId: string
): Promise<
  { provider: string; model: string; total_requests: number; total_credits: number }[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("gateway_usage")
    .select("provider, model, credits_used")
    .eq("user_id", userId);

  if (error || !data) return [];

  // Group by provider + model in JS
  const map = new Map<string, { total_requests: number; total_credits: number }>();

  for (const row of data as { provider: string; model: string; credits_used: number }[]) {
    const key = `${row.provider}::${row.model}`;
    const existing = map.get(key) ?? { total_requests: 0, total_credits: 0 };
    map.set(key, {
      total_requests: existing.total_requests + 1,
      total_credits: existing.total_credits + (row.credits_used ?? 0),
    });
  }

  return Array.from(map.entries())
    .map(([key, stats]) => {
      const [provider, model] = key.split("::");
      return { provider, model, ...stats };
    })
    .sort((a, b) => b.total_credits - a.total_credits);
}
