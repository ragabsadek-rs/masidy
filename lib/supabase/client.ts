import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return a no-op client if env vars not set (build time / local dev without Supabase)
  if (!url || !key) {
    return {
      auth: {
        signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
        signUp: async () => ({ error: { message: "Supabase not configured" } }),
        signInWithOAuth: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null } }),
        signOut: async () => {},
      },
    } as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(url, key);
}
