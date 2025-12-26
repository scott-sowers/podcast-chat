"use server";

import { auth } from "@clerk/nextjs/server";
import { searchPodcasts } from "@/lib/taddy";

export interface SearchResult {
  taddy_uuid: string;
  name: string;
  description: string | null;
  author: string | null;
  image_url: string | null;
  itunes_id: string | null;
  total_episodes: number | null;
  genres: string[];
}

export type SearchPodcastsResult =
  | { podcasts: SearchResult[]; error?: never }
  | { podcasts?: never; error: string };

export async function searchPodcastsAction(
  query: string,
  limit: number = 20
): Promise<SearchPodcastsResult> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  if (!query || query.trim().length === 0) {
    return { error: "Query is required" };
  }

  try {
    const podcasts = await searchPodcasts(query, Math.min(limit, 50));

    return {
      podcasts: podcasts.map((p) => ({
        taddy_uuid: p.uuid,
        name: p.name,
        description: p.description,
        author: p.authorName,
        image_url: p.imageUrl,
        itunes_id: p.itunesId?.toString() || null,
        total_episodes: p.totalEpisodesCount,
        genres: p.genres || [],
      })),
    };
  } catch (error) {
    console.error("Taddy API error:", error);
    return { error: "Failed to search podcasts" };
  }
}
