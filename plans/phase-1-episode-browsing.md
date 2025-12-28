# Phase 1: Episode Browsing Implementation Plan

> **Status**: Ready for Implementation (Revised)  
> **Created**: 2025-12-27  
> **Revised**: 2025-12-27 (Post-Review)  
> **Complexity**: MINIMAL (Simplified based on review feedback)  
> **Feature**: F4 - Episode Browsing & Management

---

## Overview

Implement episode browsing functionality that allows users to view all episodes of a podcast in their library. This is the foundation for transcript sync (Phase 2) and AI chat (Phase 3) features.

**Key Simplifications (Post-Review):**
- Server component architecture (no client state)
- URL-based pagination (no infinite scroll)
- No sorting dropdown (Taddy's default newest-first is correct)
- No sync/chat buttons (Phase 2/3 features)
- 2 files instead of 10

---

## Problem Statement

Users can add podcasts to their library but cannot browse episodes within a saved podcast. This creates a dead-end in the user journey.

---

## Proposed Solution

Create a podcast detail page at `/podcasts/[id]` that displays:
1. Podcast header with artwork, name, author, and description
2. Paginated episode list (25 per page)
3. Episode cards showing title, date, and duration
4. Simple Previous/Next pagination links

**Explicitly NOT included in Phase 1:**
- Episode sorting (use Taddy's default newest-first)
- Sync status badges (Phase 2)
- Sync/Chat buttons (Phase 2/3)
- Infinite scroll (YAGNI - simple pagination works)

---

## Technical Approach

### Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Podcast Detail Page                          │
│              /podcasts/[id]?page=1 (Server Component)           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Podcast Header (inline) + Episode List (inline)         │  │
│  │  - Zero client state                                      │  │
│  │  - URL-based pagination                                   │  │
│  │  - Server-rendered HTML                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Direct Data Fetching                        │
│          (No server action needed for initial GET)               │
│  • getPodcast() from Supabase                                   │
│  • getEpisodes() from Taddy (already exists!)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions (Updated)

| Decision | Original | Revised | Rationale |
|----------|----------|---------|-----------|
| Component Type | Client + Server | **Server only** | No interactivity needed for browsing |
| Pagination | Infinite scroll | **URL params** | Simpler, bookmarkable, back button works |
| State Management | 7 useState | **Zero state** | Server component handles everything |
| Episode Sorting | Dropdown | **None** | Taddy's default (newest) is correct |
| File Count | 10 files | **2 files** | Inline header/list, no abstractions |
| Sync/Chat UI | Disabled buttons | **None** | Add when features are built |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/(app)/podcasts/[id]/page.tsx` | Podcast detail page with inline header + episode list |
| `src/components/podcasts/podcast-card.tsx` | Modify to add navigation link |

**Total: 1 new file, 1 modification**

---

## Implementation

### Task 1: Create Podcast Detail Page

**File**: `src/app/(app)/podcasts/[id]/page.tsx`

```typescript
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
  const episodes = await getEpisodes(podcast.taddy_uuid, page, EPISODES_PER_PAGE);
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

      {/* Podcast Header (inline) */}
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
                          {new Date(episode.datePublished * 1000).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
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
```

**Acceptance Criteria**:
- [ ] Route `/podcasts/[id]` loads podcast from Supabase
- [ ] Uses Next.js 16 async params pattern
- [ ] Fetches episodes from Taddy using existing `getEpisodes()`
- [ ] Displays podcast artwork, name, author, description
- [ ] Shows paginated episode list (25 per page)
- [ ] URL-based pagination with Previous/Next buttons
- [ ] Shows 404 if podcast not found
- [ ] Zero client-side JavaScript for basic browsing

---

### Task 2: Update Podcast Card for Navigation

**File**: `src/components/podcasts/podcast-card.tsx` (Modify)

Add click-through navigation when card is in library view.

```typescript
// Add Link wrapper for library cards
// When isInLibrary is true, wrap card in Link to /podcasts/[id]
// Keep existing button behavior for search results
```

**Changes needed**:
1. Import `Link` from `next/link`
2. When `isInLibrary && id`, wrap card content in `<Link href={`/podcasts/${id}`}>`
3. Add `cursor-pointer` class for visual feedback

**Acceptance Criteria**:
- [ ] Cards in library view navigate to `/podcasts/[id]`
- [ ] Search result cards retain current add behavior
- [ ] Visual hover state indicates clickability

---

## What Was Removed (YAGNI)

| Removed Item | Reason |
|--------------|--------|
| `loading.tsx` | Next.js Suspense handles loading states |
| `not-found.tsx` | Next.js default 404 is sufficient |
| `episode-list.tsx` | Inlined in page - only used once |
| `episode-card.tsx` | Inlined in page - simple enough |
| `episode-sort.tsx` | YAGNI - Taddy default order is correct |
| `episode-list-skeleton.tsx` | Inlined if needed |
| `podcast-header.tsx` | Inlined in page - only used once |
| `actions/episodes.ts` | Not needed for server component GET |
| Sync status badges | Phase 2 feature |
| Sync/Chat buttons | Phase 2/3 features |
| Infinite scroll | Simple pagination is sufficient |

---

## User Flows

### Flow 1: View Podcast Episodes

```
1. User is on /library page
2. User clicks on a podcast card
3. App navigates to /podcasts/[id]
4. Server renders podcast header + first 25 episodes
5. User sees episodes with title, date, duration
6. User clicks "Next" to load more episodes
7. URL updates to /podcasts/[id]?page=2
8. Server renders next 25 episodes
```

### Flow 2: Navigate Back

```
1. User is viewing /podcasts/[id]?page=3
2. User clicks browser back button
3. Returns to /podcasts/[id]?page=2 (works because of URL state)
4. User clicks "Back to Library" link
5. Returns to /library
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Podcast not in database | 404 via `notFound()` |
| Taddy API error | Error thrown, Next.js error boundary |
| Podcast has 0 episodes | "No episodes found" message |
| Very long episode titles | `line-clamp-2` truncation |
| Missing episode artwork | No artwork shown (use podcast's) |
| Invalid page number | Defaults to page 1 |

---

## Acceptance Criteria

### Functional Requirements

- [ ] F4.1: Users can view paginated list of all episodes for a podcast
- [ ] F4.2: Episode list displays title, date, and duration
- [ ] F4.3: Users can navigate through pages with Previous/Next buttons
- [ ] F4.4: Episodes sorted by publish date (newest first - Taddy default)
- [ ] Clicking podcast card in library navigates to detail page
- [ ] Back button and "Back to Library" link work correctly

### Non-Functional Requirements

- [ ] Page loads in < 1s (server-rendered)
- [ ] Zero JavaScript required for basic browsing
- [ ] URLs are bookmarkable and shareable
- [ ] Browser back/forward navigation works

### Quality Gates

- [ ] All components have TypeScript types
- [ ] No ESLint errors or warnings
- [ ] Build passes with no errors
- [ ] Server component (no "use client")

---

## Dependencies

### Required (Already Complete)

- [x] Taddy API client with `getEpisodes()` function (`src/lib/taddy.ts:104-117`)
- [x] Supabase database with `podcasts` table
- [x] shadcn/ui components (Card, Button)
- [x] Dark theme design system

### Not Required for Phase 1

- [ ] Server action (direct fetching in server component)
- [ ] Client-side state management
- [ ] Intersection Observer / infinite scroll
- [ ] Sync status from transcripts table

---

## Implementation Checklist

- [ ] Create `src/app/(app)/podcasts/[id]/page.tsx`
- [ ] Modify `src/components/podcasts/podcast-card.tsx` for navigation
- [ ] Test pagination (page 1, 2, 3+)
- [ ] Test edge cases (no episodes, invalid page)
- [ ] Verify back button navigation works
- [ ] Run `npm run build` to confirm no errors

---

## Phase 2 Preparation

When Phase 2 (Transcript Sync) is implemented, this page will be extended to:
1. Show sync status badges on episode cards
2. Add "Sync" and "Sync All" buttons
3. Extract episode card if it becomes complex

These additions should be done in Phase 2, not pre-built here.

---

## Review Changes Summary

| Metric | Original Plan | Revised Plan |
|--------|---------------|--------------|
| Files to create | 8 | **1** |
| Files to modify | 2 | **1** |
| Client state variables | 7 | **0** |
| Total estimated LOC | ~300 | **~120** |
| Component type | Client | **Server** |
| Pagination | Infinite scroll | **URL params** |
