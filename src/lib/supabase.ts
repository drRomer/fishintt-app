import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton para uso en componentes cliente
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (typeof window === "undefined") return null;
  if (!clientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    clientInstance = createBrowserClient(url, key);
  }
  return clientInstance;
}
