import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEpisodes } from "@/lib/taddy";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, Radio } from "lucide-react";

const EPISODES_PER_PAGE = 25;

interface PodcastPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function PodcastPage({
  params,
  searchParams,
}: PodcastPageProps) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  // Fetch podcast from database
  const { data: podcast, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !podcast) {
    notFound();
  }

  // Fetch episodes from Taddy
  const episodes = await getEpisodes(
    podcast.taddy_uuid,
    page,
    EPISODES_PER_PAGE
  );
  const hasMore = episodes.length === EPISODES_PER_PAGE;
  const hasPrevious = page > 1;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/library"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Library
      </Link>

      {/* Podcast Header */}
      <header className="flex gap-6">
        <div className="size-40 shrink-0 rounded-xl overflow-hidden bg-card shadow-lg">
          {podcast.image_url ? (
            <Image
              src={podcast.image_url}
              alt={podcast.name}
              width={160}
              height={160}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-muted">
              <Radio className="size-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">
            {podcast.name}
          </h1>
          {podcast.author && (
            <p className="text-muted-foreground mt-1">By {podcast.author}</p>
          )}
          {podcast.total_episodes && (
            <p className="text-sm text-muted-foreground mt-1">
              {podcast.total_episodes} episodes
            </p>
          )}
          {podcast.description && (
            <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
              {podcast.description}
            </p>
          )}
        </div>
      </header>

      {/* Episodes Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Episodes</h2>

        {episodes.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            No episodes found
          </p>
        ) : (
          <>
            {/* Episode List */}
            <div className="space-y-3">
              {episodes.map((episode) => (
                <Card
                  key={episode.uuid}
                  className="bg-card/50 border-border/50 hover:border-border transition-colors"
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground line-clamp-2">
                      {episode.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {episode.datePublished && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {new Date(
                            episode.datePublished * 1000
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {episode.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {Math.floor(episode.duration / 60)} min
                        </span>
                      )}
                    </div>
                    {episode.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {episode.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {(hasPrevious || hasMore) && (
              <div className="flex justify-center gap-2 pt-4">
                {hasPrevious && (
                  <Button asChild variant="outline">
                    <Link href={`/podcasts/${id}?page=${page - 1}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page}
                </span>
                {hasMore && (
                  <Button asChild variant="outline">
                    <Link href={`/podcasts/${id}?page=${page + 1}`}>Next</Link>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
