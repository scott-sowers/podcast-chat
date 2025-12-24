"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PodcastCard } from "@/components/podcasts/podcast-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface LibraryPodcast {
  id: string;
  taddy_uuid: string;
  name: string;
  description: string | null;
  author: string | null;
  image_url: string | null;
  total_episodes: number | null;
  genres: string[] | null;
  added_at: string;
}

export default function LibraryPage() {
  const [podcasts, setPodcasts] = useState<LibraryPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const response = await fetch("/api/library");
      const data = await response.json();

      if (response.ok) {
        setPodcasts(data.podcasts);
      } else {
        console.error("Error fetching library:", data.error);
      }
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);

    try {
      const response = await fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setPodcasts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await response.json();
        console.error("Error removing podcast:", data.error);
      }
    } catch (error) {
      console.error("Error removing podcast:", error);
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-muted-foreground">
            Podcasts you&apos;ve added to chat with
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-muted-foreground">
            {podcasts.length === 0
              ? "No podcasts yet. Search to add some!"
              : `${podcasts.length} podcast${podcasts.length === 1 ? "" : "s"} in your library`}
          </p>
        </div>
        <Button asChild>
          <Link href="/search">Add Podcasts</Link>
        </Button>
      </div>

      {podcasts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <div className="text-4xl mb-4">🎙️</div>
          <h2 className="text-xl font-semibold mb-2">No podcasts yet</h2>
          <p className="text-muted-foreground mb-4">
            Search for podcasts to add them to your library and start chatting.
          </p>
          <Button asChild>
            <Link href="/search">Search Podcasts</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {podcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              id={podcast.id}
              taddy_uuid={podcast.taddy_uuid}
              name={podcast.name}
              description={podcast.description}
              author={podcast.author}
              image_url={podcast.image_url}
              total_episodes={podcast.total_episodes}
              genres={podcast.genres || []}
              isInLibrary={true}
              onRemove={handleRemove}
              isLoading={removingId === podcast.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
