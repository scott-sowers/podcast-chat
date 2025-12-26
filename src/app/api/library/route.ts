import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPodcast } from "@/lib/taddy";

/**
 * GET /api/library
 * Get the current user's podcast library
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { data: userPodcasts, error } = await supabase
      .from("user_podcasts")
      .select(
        `
        id,
        added_at,
        podcast:podcasts(
          id,
          taddy_uuid,
          name,
          description,
          author,
          image_url,
          total_episodes,
          genres
        )
      `,
      )
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error fetching library:", error);
      return NextResponse.json(
        { error: "Failed to fetch library" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      podcasts: userPodcasts.map((up) => ({
        id: up.id,
        added_at: up.added_at,
        ...up.podcast,
      })),
    });
  } catch (error) {
    console.error("Error fetching library:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/library
 * Add a podcast to the user's library
 */
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taddy_uuid } = await request.json();

    if (!taddy_uuid) {
      return NextResponse.json(
        { error: "taddy_uuid is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Check if podcast already exists in our database
    let { data: existingPodcast } = await supabase
      .from("podcasts")
      .select("id")
      .eq("taddy_uuid", taddy_uuid)
      .single();

    // If podcast doesn't exist, fetch from Taddy and create it
    if (!existingPodcast) {
      const taddyPodcast = await getPodcast(taddy_uuid);

      const { data: newPodcast, error: insertError } = await adminClient
        .from("podcasts")
        .insert({
          taddy_uuid: taddyPodcast.uuid,
          itunes_id: taddyPodcast.itunesId?.toString() || null,
          name: taddyPodcast.name,
          description: taddyPodcast.description,
          author: taddyPodcast.authorName,
          image_url: taddyPodcast.imageUrl,
          rss_url: taddyPodcast.rssUrl,
          language: taddyPodcast.language || null,
          total_episodes: taddyPodcast.totalEpisodesCount,
          genres: taddyPodcast.genres || [],
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating podcast:", insertError);
        return NextResponse.json(
          { error: "Failed to add podcast" },
          { status: 500 },
        );
      }

      existingPodcast = newPodcast;
    }

    // Check if user already has this podcast in their library
    const { data: existingUserPodcast } = await supabase
      .from("user_podcasts")
      .select("id")
      .eq("user_id", userProfile.id)
      .eq("podcast_id", existingPodcast.id)
      .single();

    if (existingUserPodcast) {
      return NextResponse.json(
        { error: "Podcast already in library" },
        { status: 409 },
      );
    }

    // Add podcast to user's library
    const { data: userPodcast, error: addError } = await supabase
      .from("user_podcasts")
      .insert({
        user_id: userProfile.id,
        podcast_id: existingPodcast.id,
      })
      .select("id")
      .single();

    if (addError) {
      console.error("Error adding to library:", addError);
      return NextResponse.json(
        { error: "Failed to add to library" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: userPodcast.id });
  } catch (error) {
    console.error("Error adding to library:", error);
    return NextResponse.json(
      { error: "Failed to add podcast to library" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/library
 * Remove a podcast from the user's library
 */
export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("user_podcasts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing from library:", error);
      return NextResponse.json(
        { error: "Failed to remove from library" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from library:", error);
    return NextResponse.json(
      { error: "Failed to remove podcast from library" },
      { status: 500 },
    );
  }
}
