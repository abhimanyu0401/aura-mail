import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your_supabase")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://placeholder-project.supabase.co";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.includes("your_supabase")
      ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      : "placeholder-publishable-key";

  return createBrowserClient(url, key);
}
