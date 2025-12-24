"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Hook to create a Supabase client with Clerk authentication.
 * Uses the Clerk session token for RLS policies.
 */
export function useSupabaseClient() {
  const { session } = useSession();

  const supabase = useMemo(() => {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          return (await session?.getToken()) ?? null;
        },
      },
    );
  }, [session]);

  return supabase;
}

/**
 * Create a basic Supabase client without authentication.
 * Use this for public data access only.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
