"use client";

import { useState } from "react";
import { SearchInput } from "@/components/podcasts/search-input";
import { PodcastCard } from "@/components/podcasts/podcast-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  searchPodcastsAction,
  type SearchResult,
} from "@/lib/actions/podcasts";

export function DiscoverContent() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingPodcast, setAddingPodcast] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const result = await searchPodcastsAction(query);

      if (result.error) {
        console.error("Search error:", result.error);
        setResults([]);
      } else {
        setResults(result.podcasts ?? []);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Discover</h1>
        <p className="text-muted-foreground mt-1">
          Search and add podcasts to your library
        </p>
      </div>

      <div className="max-w-xl">
        <SearchInput
          onSearch={handleSearch}
          isLoading={isSearching}
          placeholder="Search podcasts, hosts, topics..."
        />
      </div>

      {isSearching && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
