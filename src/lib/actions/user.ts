"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  subscription_tier: "free" | "pro" | "team";
  monthly_chat_count: number;
  monthly_sync_count: number;
  billing_cycle_start: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's profile, creating one if it doesn't exist.
 * This should be called on protected pages to ensure the user has a profile.
 */
export async function getOrCreateUserProfile(): Promise<UserProfile | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const supabase = await createClient();

  // Try to get existing profile
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (existingProfile) {
    return existingProfile as UserProfile;
  }

  // Profile doesn't exist, create one using admin client (bypasses RLS for insert)
  // This is needed because the user doesn't have a profile yet to satisfy the RLS check
  const adminClient = createAdminClient();

  const { data: newProfile, error: insertError } = await adminClient
    .from("user_profiles")
    .insert({
      clerk_user_id: userId,
      subscription_tier: "free",
      monthly_chat_count: 0,
      monthly_sync_count: 0,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating user profile:", insertError);
    return null;
  }

  return newProfile as UserProfile;
}

/**
 * Get the current user's profile.
 * Returns null if no profile exists.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}
