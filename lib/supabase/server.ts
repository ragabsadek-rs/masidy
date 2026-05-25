import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Standard client — respects RLS, uses anon key
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
        insert: async () => ({}),
        update: () => ({ eq: async () => ({}) }),
        upsert: async () => ({}),
      }),
    } as unknown as Awaited<ReturnType<typeof createServerClient>>;
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

// Admin client — bypasses RLS, uses service role key
// Only use server-side in API routes, never expose to client
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
        insert: async () => ({}),
        update: () => ({ eq: async () => ({}) }),
        upsert: async () => ({}),
      }),
    } as unknown as ReturnType<typeof createServerClient>;
  }

  return createServerClient(url, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false },
  });
}
