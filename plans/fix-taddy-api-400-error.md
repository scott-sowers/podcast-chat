# fix: Taddy API 400 Error on Podcast Search

**Created:** 2025-12-24
**Type:** Bug Fix
**Priority:** High (blocks core functionality)

## Overview

The podcast search API returns a 500 error due to invalid GraphQL query syntax when calling the Taddy API. The error occurs because the queries in `src/lib/taddy.ts` use incorrect parameter names and treat scalar types as objects.

## Problem Statement

When searching for podcasts (e.g., `/api/podcasts/search?q=joe%20rogan`), the API returns:

```
Taddy API error: Error: Taddy API error: 400
```

**Root Causes Identified:**

1. **Invalid pagination parameter**: Using `first` instead of `limitPerPage`
2. **Incorrect field types**: Treating `genres` and `language` as objects with subfields when they are scalar/enum types

## Technical Analysis

### Current Code (Broken)

```graphql
# src/lib/taddy.ts:79-93
query SearchPodcasts($term: String!, $first: Int) {
  searchForTerm(term: $term, filterForTypes: PODCASTSERIES, first: $first) {
    # ...
    genres {
      name  # ERROR: genres is [Genre] scalar, not object
    }
  }
}
```

**Taddy API Response:**
```json
{"errors":[{"message":"Unknown argument \"first\" on field \"Query.searchForTerm\".","code":"INVALID_QUERY_OR_SYNTAX"}]}
```

### Correct API Schema (Verified via Testing)

| Field | Incorrect Type | Correct Type | Example Value |
|-------|----------------|--------------|---------------|
| `genres` | `[{name: string}]` | `string[]` | `["PODCASTSERIES_COMEDY"]` |
| `language` | `{name: string}` | `string` | `"ENGLISH"` |
| `first` (pagination) | N/A | `limitPerPage` | `20` |

## Acceptance Criteria

- [ ] Podcast search returns results successfully
- [ ] `GET /api/podcasts/search?q=joe%20rogan` returns 200 with podcast data
- [ ] Types correctly reflect the actual API response shape
- [ ] All Taddy API queries in the file are fixed

## Implementation

### File: `src/lib/taddy.ts`

#### 1. Fix `SEARCH_PODCASTS_QUERY` (lines 79-93)

**Before:**
```graphql
query SearchPodcasts($term: String!, $first: Int) {
  searchForTerm(term: $term, filterForTypes: PODCASTSERIES, first: $first) {
    searchId
    podcastSeries {
      uuid
      name
      description
      authorName
      imageUrl
      itunesId
      totalEpisodesCount
      genres {
        name
      }
    }
  }
}
```

**After:**
```graphql
query SearchPodcasts($term: String!, $limitPerPage: Int) {
  searchForTerm(term: $term, filterForTypes: PODCASTSERIES, limitPerPage: $limitPerPage) {
    searchId
    podcastSeries {
      uuid
      name
      description
      authorName
      imageUrl
      itunesId
      totalEpisodesCount
      genres
    }
  }
}
```

#### 2. Fix `GET_PODCAST_QUERY` (lines 95-112)

**Before:**
```graphql
query GetPodcast($uuid: ID!) {
  getPodcastSeries(uuid: $uuid) {
    # ...
    language {
      name
    }
    # ...
    genres {
      name
    }
  }
}
```

**After:**
```graphql
query GetPodcast($uuid: ID!) {
  getPodcastSeries(uuid: $uuid) {
    # ...
    language
    # ...
    genres
  }
}
```

#### 3. Update TypeScript Types (lines 48-60)

**Before:**
```typescript
export interface TaddyPodcast {
  // ...
  language: { name: string } | null;
  // ...
  genres: Array<{ name: string }> | null;
}
```

**After:**
```typescript
export interface TaddyPodcast {
  // ...
  language: string | null;
  // ...
  genres: string[] | null;
}
```

#### 4. Update `searchPodcasts` function (lines 178-186)

**Before:**
```typescript
export async function searchPodcasts(
  term: string,
  limit: number = 20
): Promise<TaddyPodcast[]> {
  const data = await taddyQuery<SearchPodcastsResult>(SEARCH_PODCASTS_QUERY, {
    term,
    first: limit,
  });
  return data.searchForTerm.podcastSeries;
}
```

**After:**
```typescript
export async function searchPodcasts(
  term: string,
  limit: number = 20
): Promise<TaddyPodcast[]> {
  const data = await taddyQuery<SearchPodcastsResult>(SEARCH_PODCASTS_QUERY, {
    term,
    limitPerPage: limit,
  });
  return data.searchForTerm.podcastSeries;
}
```

### File: `src/app/api/podcasts/search/route.ts`

#### 5. Update genre mapping (line 31)

**Before:**
```typescript
genres: p.genres?.map((g) => g.name) || [],
```

**After:**
```typescript
genres: p.genres || [],
```

## Testing

After making changes, verify with:

```bash
# Start dev server
npm run dev

# Test search endpoint
curl "http://localhost:3000/api/podcasts/search?q=joe%20rogan" | jq
```

Expected: 200 response with array of podcasts including "The Joe Rogan Experience"

## References

- [Taddy API Documentation](https://taddy.org/developers/intro-to-taddy-graphql-api)
- [Taddy Search API](https://taddy.org/developers/podcast-api/search)
- [Taddy Example Project](https://github.com/taddyorg/taddy-api-example-project)
- Affected file: `src/lib/taddy.ts:33`
