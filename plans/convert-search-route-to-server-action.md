# Plan: Convert Podcast Search Route to Server Action

## Overview

Convert `src/app/api/podcasts/search/route.ts` to a server action and update the search page to call the action directly instead of fetching from the API route.

## Current State

- **API Route**: `src/app/api/podcasts/search/route.ts` - handles GET requests with query params
- **Client**: `src/app/(app)/search/page.tsx` - calls the API via `fetch()`
- **Existing Pattern**: Server actions already exist in `src/lib/actions/user.ts`

## Changes Required

### 1. Create Server Action

**File**: `src/lib/actions/podcasts.ts`

Create a new server action file that:
- Uses `"use server"` directive
- Exports `searchPodcastsAction(query: string, limit?: number)` function
- Includes Clerk auth check (returns error for unauthenticated users)
- Returns typed result with `{ podcasts: SearchResult[] }` or `{ error: string }`
- Maps Taddy response to the same shape currently returned by the API

### 2. Update Search Page

**File**: `src/app/(app)/search/page.tsx`

- Import and call `searchPodcastsAction` directly instead of `fetch()`
- Handle the action response (check for error field)
- Remove URL encoding since we're passing the query directly

### 3. Delete API Route

**File**: `src/app/api/podcasts/search/route.ts`

- Delete the file entirely

## Implementation Details

### Server Action Interface

```typescript
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
): Promise<SearchPodcastsResult>
```

### Updated Search Handler

```typescript
const handleSearch = async (query: string) => {
  setIsSearching(true);
  setHasSearched(true);

  try {
    const result = await searchPodcastsAction(query);
    
    if (result.error) {
      console.error("Search error:", result.error);
      setResults([]);
    } else {
      setResults(result.podcasts);
    }
  } catch (error) {
    console.error("Search error:", error);
    setResults([]);
  } finally {
    setIsSearching(false);
  }
};
```

## Files to Modify

1. **Create**: `src/lib/actions/podcasts.ts` - new server action
2. **Modify**: `src/app/(app)/search/page.tsx` - use server action instead of fetch
3. **Delete**: `src/app/api/podcasts/search/route.ts` - remove API route

## Testing

After implementation:
1. Navigate to the search page
2. Enter a search query
3. Verify results appear correctly
4. Verify unauthorized users cannot search (should show error or redirect)
