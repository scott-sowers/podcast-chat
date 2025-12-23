import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { searchPodcasts } from "@/lib/taddy";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const podcasts = await searchPodcasts(query, Math.min(limit, 50));

    return NextResponse.json({
      podcasts: podcasts.map((p) => ({
        taddy_uuid: p.uuid,
        name: p.name,
        description: p.description,
        author: p.authorName,
        image_url: p.imageUrl,
        itunes_id: p.itunesId?.toString() || null,
        total_episodes: p.totalEpisodesCount,
        genres: p.genres?.map((g) => g.name) || [],
      })),
    });
  } catch (error) {
    console.error("Taddy API error:", error);
    return NextResponse.json(
      { error: "Failed to search podcasts" },
      { status: 500 }
    );
  }
}
