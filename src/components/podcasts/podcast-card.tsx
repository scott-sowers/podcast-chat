"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PodcastCardProps {
  id?: string;
  taddy_uuid: string;
  name: string;
  description: string | null;
  author: string | null;
  image_url: string | null;
  total_episodes: number | null;
  genres?: string[];
  isInLibrary?: boolean;
  onAdd?: (taddyUuid: string) => void;
  onRemove?: (id: string) => void;
  isLoading?: boolean;
}

export function PodcastCard({
  id,
  taddy_uuid,
  name,
  description,
  author,
  image_url,
  total_episodes,
  genres,
  isInLibrary,
  onAdd,
  onRemove,
  isLoading,
}: PodcastCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl">🎙️</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1">{name}</h3>
        {author && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            By {author}
          </p>
        )}
        {total_episodes && (
          <p className="text-xs text-muted-foreground mt-1">
            {total_episodes} episodes
          </p>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {description}
          </p>
        )}
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isInLibrary ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => id && onRemove?.(id)}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : "Remove from Library"}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onAdd?.(taddy_uuid)}
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add to Library"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
