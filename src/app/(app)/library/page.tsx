"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PodcastCard } from "@/components/podcasts/podcast-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";

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
  const [search, setSearch] = useState("");

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

  const filtered = podcasts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Library
          </h1>
          <p className="text-muted-foreground mt-1">
            {podcasts.length} podcast{podcasts.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Button asChild className="gradient-accent border-0">
          <Link href="/">
            <Plus className="h-4 w-4 mr-2" />
            Add Podcasts
          </Link>
        </Button>
      </div>

      {/* Search */}
      {!isLoading && podcasts.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && podcasts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Your library is empty</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/">Discover podcasts to add</Link>
          </Button>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && podcasts.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No podcasts match &quot;{search}&quot;
          </p>
        </div>
      )}

      {/* Podcast Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((podcast) => (
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
