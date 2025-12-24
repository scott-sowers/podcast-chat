"use client";

import { useState } from "react";
import { SearchInput } from "@/components/podcasts/search-input";
import { PodcastCard } from "@/components/podcasts/podcast-card";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResult {
  taddy_uuid: string;
  name: string;
  description: string | null;
  author: string | null;
  image_url: string | null;
  total_episodes: number | null;
  genres: string[];
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingPodcast, setAddingPodcast] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/podcasts/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (response.ok) {
        setResults(data.podcasts);
      } else {
        console.error("Search error:", data.error);
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToLibrary = async (taddyUuid: string) => {
    setAddingPodcast(taddyUuid);

    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taddy_uuid: taddyUuid }),
      });

      if (response.ok) {
        // Remove from search results to show it's been added
        setResults((prev) => prev.filter((p) => p.taddy_uuid !== taddyUuid));
      } else {
        const data = await response.json();
        console.error("Add to library error:", data.error);
      }
    } catch (error) {
      console.error("Add to library error:", error);
    } finally {
      setAddingPodcast(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Podcasts</h1>
        <p className="text-muted-foreground">
          Find podcasts to add to your library
        </p>
      </div>

      <SearchInput onSearch={handleSearch} isLoading={isSearching} />

      {isSearching && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((podcast) => (
            <PodcastCard
              key={podcast.taddy_uuid}
              {...podcast}
              onAdd={handleAddToLibrary}
              isLoading={addingPodcast === podcast.taddy_uuid}
            />
          ))}
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No podcasts found. Try a different search term.
          </p>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Search for podcasts to add to your library.
          </p>
        </div>
      )}
    </div>
  );
}
