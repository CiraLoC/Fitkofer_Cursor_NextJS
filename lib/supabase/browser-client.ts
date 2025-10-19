import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { createMockBrowserClient } from "./mock-client";

export function createBrowserClient() {
  if (process.env.NEXT_PUBLIC_SUPABASE_MODE === "mock") {
    console.info("Using mock Supabase browser client");
    return createMockBrowserClient() as any;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase environment variables are missing for browser client.");
  }

  return createSupabaseBrowserClient(supabaseUrl ?? "", supabaseKey ?? "");
}
