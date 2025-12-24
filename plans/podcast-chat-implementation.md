# Podcast Chat - Complete Implementation Plan

## Overview

This plan covers the full implementation of Podcast Chat, an AI-powered web application for conversing with podcast content. The project builds on an existing foundation of Next.js 16, Clerk authentication, and Supabase setup.

**Current Date**: December 2025

---

## Current State Analysis

### ✅ Already Implemented

| Component | Status | Location |
|-----------|--------|----------|
| Next.js 16.1.1 | Complete | `package.json` |
| React 19.2.3 | Complete | `package.json` |
| TypeScript 5 (strict) | Complete | `tsconfig.json` |
| Tailwind CSS 4 | Complete | `globals.css`, `postcss.config.mjs` |
| Clerk Auth v6.36.5 | Complete | `src/middleware.ts`, `src/app/layout.tsx` |
| ClerkProvider | Complete | `src/app/layout.tsx:31` |
| Sign In/Up buttons | Complete | `src/app/layout.tsx:35-40` |
| Supabase SSR v0.8.0 | Complete | `package.json` |
| Server client | Complete | `src/lib/supabase/server.ts` |
| Browser client | Complete | `src/lib/supabase/client.ts` |
| Clerk third-party auth | Complete | `supabase/config.toml:216-218` |
| pnpm package manager | Complete | `pnpm-lock.yaml` |

### ❌ Not Implemented

#### Dependencies to Install
```bash
# UI Components
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card dialog input textarea scroll-area skeleton badge tabs avatar dropdown-menu

# AI & Chat
pnpm add ai @ai-sdk/openai @ai-sdk/react zod

# Background Jobs
pnpm add @trigger.dev/sdk @trigger.dev/react-hooks

# Vector Database
pnpm add chromadb

# Transcription
pnpm add @deepgram/sdk

# Utilities
pnpm add graphql-request next-themes lucide-react
```

#### Database Schema
- 9 tables required per PRD
- RLS policies for user data isolation
- No migrations exist yet

#### Application Features
- F1: User profile management (partial - auth works, no profiles)
- F2: Podcast search & discovery
- F3: Library management
- F4: Episode browsing
- F5: Transcript sync pipeline
- F6: AI chat with RAG

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

#### 1.1 Initialize ShadCN UI

```bash
pnpm dlx shadcn@latest init
```

**Configuration:**
- Style: New York
- Base color: Slate
- CSS variables: Yes
- Tailwind CSS 4: Yes

**Files created:**
- `components.json`
- `src/components/ui/` directory
- `src/lib/utils.ts`

#### 1.2 Install Dependencies

```bash
# All dependencies in one command
pnpm add ai @ai-sdk/openai @ai-sdk/react zod @trigger.dev/sdk @trigger.dev/react-hooks chromadb @deepgram/sdk graphql-request next-themes lucide-react

# Add ShadCN components
pnpm dlx shadcn@latest add button card dialog input textarea scroll-area skeleton badge tabs avatar dropdown-menu sheet separator command popover
```

#### 1.3 Create Environment Variables Template

**File: `.env.example`**
```env
# =============================================================================
# Supabase
# =============================================================================
# Get these from: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  # Also called "publishable key" - safe for browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...      # Server-only! Never expose to client

# =============================================================================
# Clerk
# =============================================================================
# Get these from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...              # For user.created webhook

# =============================================================================
# Taddy API (Podcast Data)
# =============================================================================
# Get these from: https://taddy.org/developers
TADDY_USER_ID=
TADDY_API_KEY=

# =============================================================================
# OpenAI (Embeddings + Chat)
# =============================================================================
OPENAI_API_KEY=sk-...

# =============================================================================
# ChromaDB (Vector Store)
# =============================================================================
CHROMA_URL=http://localhost:8000
CHROMA_API_KEY=                             # Optional for local development

# =============================================================================
# Deepgram (Transcription Fallback)
# =============================================================================
DEEPGRAM_API_KEY=

# =============================================================================
# Trigger.dev (Background Jobs)
# =============================================================================
TRIGGER_SECRET_KEY=tr_dev_...
```

#### 1.4 Create Database Migrations

> **Note:** This integration uses Supabase's official Third-Party Auth with Clerk.
> The old JWT template method is deprecated as of April 1, 2025.
> With Third-Party Auth, use `auth.jwt()->>'sub'` directly in RLS policies to access the Clerk user ID.

**File: `supabase/migrations/001_initial_schema.sql`**
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: With Clerk Third-Party Auth, we use auth.jwt()->>'sub' directly in RLS policies.
-- No custom auth.user_id() function is needed - Supabase handles Clerk JWTs natively.

-- Users are managed by Clerk, we store additional metadata
-- The clerk_user_id column stores the Clerk user ID (from JWT 'sub' claim)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
  monthly_chat_count INTEGER DEFAULT 0,
  monthly_sync_count INTEGER DEFAULT 0,
  billing_cycle_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global podcast registry (shared across users)
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taddy_uuid TEXT UNIQUE NOT NULL,
  itunes_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  author TEXT,
  image_url TEXT,
  rss_url TEXT,
  language TEXT,
  total_episodes INTEGER,
  genres JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's podcast library (many-to-many)
CREATE TABLE user_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, podcast_id)
);

-- Global episode registry (shared across users)
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  taddy_uuid TEXT UNIQUE NOT NULL,
  guid TEXT,
  name TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  image_url TEXT,
  duration INTEGER, -- seconds
  published_at TIMESTAMPTZ,
  episode_number INTEGER,
  season_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global transcripts (shared across users, deduplicated)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE UNIQUE,
  chroma_collection_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('taddy', 'deepgram')),
  status TEXT DEFAULT 'not_synced' CHECK (status IN ('not_synced', 'queued', 'syncing', 'synced', 'failed')),
  error_message TEXT,
  full_text TEXT,
  chunk_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's synced episodes (tracks which episodes user has access to)
CREATE TABLE user_synced_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT,
  context_podcast_ids UUID[],
  context_episode_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync jobs tracking
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  trigger_run_id TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_user_podcasts_user_id ON user_podcasts(user_id);
CREATE INDEX idx_user_podcasts_podcast_id ON user_podcasts(podcast_id);
CREATE INDEX idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX idx_transcripts_episode_id ON transcripts(episode_id);
CREATE INDEX idx_transcripts_status ON transcripts(status);
CREATE INDEX idx_user_synced_episodes_user_id ON user_synced_episodes(user_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
```

**File: `supabase/migrations/002_rls_policies.sql`**
```sql
-- ============================================================================
-- RLS Policies for Clerk Third-Party Auth Integration
-- ============================================================================
-- With Supabase's official Clerk Third-Party Auth, use auth.jwt()->>'sub'
-- to access the Clerk user ID directly. No custom functions needed.
--
-- The 'sub' claim in Clerk session tokens contains the user ID (e.g., 'user_2abc123')
-- Reference: https://supabase.com/docs/guides/auth/third-party/clerk
-- ============================================================================

-- Enable RLS on all user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_synced_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

-- Podcasts and episodes are publicly readable
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- User Profiles Policies
-- ============================================================================
-- Users can only access their own profile by matching clerk_user_id to JWT sub claim

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

-- Insert policy: user can only create a profile with their own Clerk ID
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

-- ============================================================================
-- User Podcasts Policies
-- ============================================================================

CREATE POLICY "Users can view own library" ON user_podcasts
  FOR SELECT TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can add to own library" ON user_podcasts
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can remove from own library" ON user_podcasts
  FOR DELETE TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

-- ============================================================================
-- User Synced Episodes Policies
-- ============================================================================

CREATE POLICY "Users can view own synced episodes" ON user_synced_episodes
  FOR SELECT TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can add synced episodes" ON user_synced_episodes
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can remove synced episodes" ON user_synced_episodes
  FOR DELETE TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

-- ============================================================================
-- Chat Sessions Policies
-- ============================================================================

CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can create chat sessions" ON chat_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

-- ============================================================================
-- Chat Messages Policies
-- ============================================================================

CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT cs.id FROM chat_sessions cs
    JOIN user_profiles up ON cs.user_id = up.id
    WHERE up.clerk_user_id = (select auth.jwt()->>'sub')
  ));

CREATE POLICY "Users can insert messages in own sessions" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT cs.id FROM chat_sessions cs
    JOIN user_profiles up ON cs.user_id = up.id
    WHERE up.clerk_user_id = (select auth.jwt()->>'sub')
  ));

-- ============================================================================
-- Sync Jobs Policies
-- ============================================================================

CREATE POLICY "Users can view own sync jobs" ON sync_jobs
  FOR SELECT TO authenticated
  USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = (select auth.jwt()->>'sub')
  ));

-- Note: Sync jobs are created server-side with service role key
-- Users don't need INSERT policy for sync_jobs

-- ============================================================================
-- Global Tables (readable by all authenticated users)
-- ============================================================================

CREATE POLICY "Podcasts are readable" ON podcasts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Episodes are readable" ON episodes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Transcripts are readable" ON transcripts
  FOR SELECT TO authenticated
  USING (true);

-- Note: INSERT/UPDATE on podcasts, episodes, transcripts done via service role key
-- These tables are global registries, not user-specific
```

#### 1.5 Clerk + Supabase Third-Party Auth Integration

> **Important:** This uses Supabase's official Third-Party Auth with Clerk.
> The old JWT template method (`getToken({ template: 'supabase' })`) is **deprecated as of April 1, 2025**.
> With Third-Party Auth, use Clerk's native session tokens directly via `getToken()` (no template).
> Reference: https://supabase.com/docs/guides/auth/third-party/clerk

**File: `src/lib/supabase/clerk-server.ts`** (Server Components, Route Handlers, Server Actions)
```typescript
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Creates a Supabase client authenticated with Clerk's session token.
 * Uses Supabase's Third-Party Auth integration - no JWT template needed.
 * 
 * The Clerk session token's 'sub' claim is accessible in RLS policies via auth.jwt()->>'sub'
 */
export async function createServerSupabaseClient() {
  const { getToken } = await auth()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Also called "publishable key"
    {
      accessToken: async () => {
        // Use native Clerk session token - no template parameter needed
        return await getToken() ?? null
      },
    }
  )
}
```

**File: `src/lib/supabase/clerk-client.ts`** (Client Components)
```typescript
'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

/**
 * Hook to create a Supabase client authenticated with Clerk's session token.
 * For use in Client Components only.
 */
export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession()
  
  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          // Get native Clerk session token - no template needed
          return session?.getToken() ?? null
        },
      }
    )
  }, [session])
}
```

**File: `src/lib/supabase/admin.ts`** (Service Role for server-side operations)
```typescript
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client with service role key.
 * Use for operations that bypass RLS (webhooks, background jobs, etc.)
 * NEVER expose this client to the browser.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

#### 1.6 User Profile Creation (Webhook or On-Demand)

**File: `src/app/api/webhooks/clerk/route.ts`**
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id: clerkUserId } = evt.data

    await supabaseAdmin.from('user_profiles').insert({
      clerk_user_id: clerkUserId,
      subscription_tier: 'free',
      monthly_chat_count: 0,
      monthly_sync_count: 0,
      billing_cycle_start: new Date().toISOString(),
    })
  }

  return new Response('Webhook received', { status: 200 })
}
```

#### 1.7 Protected Routes Middleware Update

**File: `src/middleware.ts`** (update existing)
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/library(.*)',
  '/podcasts(.*)',
  '/chat(.*)',
  '/api/chat(.*)',
  '/api/podcasts(.*)',
  '/api/episodes(.*)',
  '/api/library(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

---

### Phase 2: Podcast Management (Week 2)

#### 2.1 Taddy GraphQL Client

**File: `src/lib/taddy.ts`**
```typescript
const TADDY_API_URL = 'https://api.taddy.org'

interface TaddyResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

export async function taddyQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(TADDY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-USER-ID': process.env.TADDY_USER_ID!,
      'X-API-KEY': process.env.TADDY_API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 }, // Cache for 1 hour
  })

  const result: TaddyResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result.data
}

// Search podcasts
export async function searchPodcasts(term: string, limit = 20) {
  const query = `
    query SearchPodcasts($term: String!, $first: Int!) {
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
          genres { name }
        }
      }
    }
  `
  
  const data = await taddyQuery<{
    searchForTerm: {
      podcastSeries: Array<{
        uuid: string
        name: string
        description: string
        authorName: string
        imageUrl: string
        itunesId: number
        totalEpisodesCount: number
        genres: Array<{ name: string }>
      }>
    }
  }>(query, { term, first: limit })
  
  return data.searchForTerm.podcastSeries
}

// Get podcast details
export async function getPodcast(uuid: string) {
  const query = `
    query GetPodcast($uuid: ID!) {
      getPodcastSeries(uuid: $uuid) {
        uuid
        name
        description
        authorName
        imageUrl
        itunesId
        rssUrl
        language { name }
        totalEpisodesCount
        genres { name }
      }
    }
  `
  
  const data = await taddyQuery<{
    getPodcastSeries: {
      uuid: string
      name: string
      description: string
      authorName: string
      imageUrl: string
      itunesId: number
      rssUrl: string
      language: { name: string }
      totalEpisodesCount: number
      genres: Array<{ name: string }>
    }
  }>(query, { uuid })
  
  return data.getPodcastSeries
}

// Get episodes with pagination
export async function getEpisodes(podcastUuid: string, page = 1, limit = 25) {
  const query = `
    query GetEpisodes($uuid: ID!, $page: Int!, $limitPerPage: Int!) {
      getPodcastSeries(uuid: $uuid) {
        uuid
        episodes(page: $page, limitPerPage: $limitPerPage, sortOrder: LATEST) {
          uuid
          name
          description
          audioUrl
          imageUrl
          duration
          datePublished
          seasonNumber
          episodeNumber
          guid
          taddyTranscribeStatus
        }
      }
    }
  `
  
  const data = await taddyQuery<{
    getPodcastSeries: {
      uuid: string
      episodes: Array<{
        uuid: string
        name: string
        description: string
        audioUrl: string
        imageUrl: string
        duration: number
        datePublished: number
        seasonNumber: number
        episodeNumber: number
        guid: string
        taddyTranscribeStatus: string
      }>
    }
  }>(query, { uuid: podcastUuid, page, limitPerPage: limit })
  
  return data.getPodcastSeries.episodes
}

// Get episode transcript
export async function getEpisodeTranscript(uuid: string) {
  const query = `
    query GetEpisodeTranscript($uuid: ID!) {
      getPodcastEpisode(uuid: $uuid) {
        uuid
        name
        taddyTranscribeStatus
        transcript
        transcriptWithSpeakersAndTimecodes {
          text
          startTime
          endTime
          speaker
        }
      }
    }
  `
  
  const data = await taddyQuery<{
    getPodcastEpisode: {
      uuid: string
      name: string
      taddyTranscribeStatus: string
      transcript: string | null
      transcriptWithSpeakersAndTimecodes: Array<{
        text: string
        startTime: number
        endTime: number
        speaker: string | null
      }> | null
    }
  }>(query, { uuid })
  
  return data.getPodcastEpisode
}
```

#### 2.2 Podcast Search API Route

**File: `src/app/api/podcasts/search/route.ts`**
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { searchPodcasts } from '@/lib/taddy'

export async function GET(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    const podcasts = await searchPodcasts(query)
    return NextResponse.json({ podcasts })
  } catch (error) {
    console.error('Taddy API error:', error)
    return NextResponse.json(
      { error: 'Failed to search podcasts' },
      { status: 500 }
    )
  }
}
```

#### 2.3 Add to Library Action

**File: `src/app/actions/library.ts`**
```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'
import { getPodcast } from '@/lib/taddy'
import { revalidatePath } from 'next/cache'

const SUBSCRIPTION_LIMITS = {
  free: { podcasts: 3, syncs: 30, chats: 100 },
  pro: { podcasts: 25, syncs: 500, chats: Infinity },
  team: { podcasts: Infinity, syncs: Infinity, chats: Infinity },
}

export async function addPodcastToLibrary(taddyUuid: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createServerSupabaseClient()

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Check podcast limit
  const { count } = await supabase
    .from('user_podcasts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  const tier = profile.subscription_tier as keyof typeof SUBSCRIPTION_LIMITS
  const limit = SUBSCRIPTION_LIMITS[tier].podcasts

  if (count !== null && count >= limit) {
    throw new Error(`Podcast limit reached (${limit}). Upgrade to add more.`)
  }

  // Check if podcast exists globally
  let { data: podcast } = await supabase
    .from('podcasts')
    .select('id')
    .eq('taddy_uuid', taddyUuid)
    .single()

  // If not, fetch from Taddy and create
  if (!podcast) {
    const taddyPodcast = await getPodcast(taddyUuid)
    
    const { data: newPodcast, error } = await supabase
      .from('podcasts')
      .insert({
        taddy_uuid: taddyPodcast.uuid,
        name: taddyPodcast.name,
        description: taddyPodcast.description,
        author: taddyPodcast.authorName,
        image_url: taddyPodcast.imageUrl,
        itunes_id: taddyPodcast.itunesId?.toString(),
        rss_url: taddyPodcast.rssUrl,
        language: taddyPodcast.language?.name,
        total_episodes: taddyPodcast.totalEpisodesCount,
        genres: taddyPodcast.genres,
      })
      .select('id')
      .single()

    if (error) throw new Error('Failed to create podcast record')
    podcast = newPodcast
  }

  // Add to user's library
  const { error: linkError } = await supabase
    .from('user_podcasts')
    .insert({
      user_id: profile.id,
      podcast_id: podcast.id,
    })

  if (linkError) {
    if (linkError.code === '23505') {
      throw new Error('Podcast already in library')
    }
    throw new Error('Failed to add podcast to library')
  }

  revalidatePath('/library')
  return { success: true }
}

export async function removePodcastFromLibrary(podcastId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createServerSupabaseClient()

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Delete user_podcast association
  await supabase
    .from('user_podcasts')
    .delete()
    .eq('user_id', profile.id)
    .eq('podcast_id', podcastId)

  // Delete user's synced episodes for this podcast
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id')
    .eq('podcast_id', podcastId)

  if (episodes && episodes.length > 0) {
    const episodeIds = episodes.map(e => e.id)
    await supabase
      .from('user_synced_episodes')
      .delete()
      .eq('user_id', profile.id)
      .in('episode_id', episodeIds)
  }

  revalidatePath('/library')
  return { success: true }
}
```

#### 2.4 Library Page

**File: `src/app/library/page.tsx`**
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'
import { PodcastCard } from '@/components/podcast/podcast-card'
import { SearchPodcasts } from '@/components/podcast/search-podcasts'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function LibraryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createServerSupabaseClient()

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) {
    // Create profile if doesn't exist (fallback)
    await supabase.from('user_profiles').insert({
      clerk_user_id: userId,
    })
    redirect('/library')
  }

  // Get user's podcasts
  const { data: userPodcasts } = await supabase
    .from('user_podcasts')
    .select(`
      added_at,
      podcast:podcasts(
        id,
        name,
        author,
        image_url,
        total_episodes,
        taddy_uuid
      )
    `)
    .eq('user_id', profile.id)
    .order('added_at', { ascending: false })

  const podcasts = userPodcasts?.map(up => up.podcast) ?? []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Library</h1>
        <SearchPodcasts />
      </div>

      {podcasts.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">No podcasts yet</h2>
          <p className="text-muted-foreground mb-4">
            Search for podcasts to add to your library
          </p>
          <SearchPodcasts trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Podcast
            </Button>
          } />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### Phase 3: Episodes & Sync (Week 3)

#### 3.1 Trigger.dev Configuration

**File: `trigger.config.ts`**
```typescript
import { defineConfig } from '@trigger.dev/sdk/v3'

export default defineConfig({
  project: 'podcast-chat',
  runtime: 'node',
  logLevel: 'log',
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 30000,
      factor: 2,
    },
  },
  dirs: ['src/trigger'],
})
```

#### 3.2 Transcription Task

**File: `src/trigger/transcribe-episode.ts`**
```typescript
import { task } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import { createClient as createDeepgramClient } from '@deepgram/sdk'
import { getEpisodeTranscript } from '@/lib/taddy'
import { ChromaClient } from 'chromadb'
import { OpenAI } from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const deepgram = createDeepgramClient(process.env.DEEPGRAM_API_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const chroma = new ChromaClient({ path: process.env.CHROMA_URL })

interface TranscribePayload {
  episodeId: string
  taddyUuid: string
  audioUrl: string
  podcastId: string
  podcastName: string
  episodeName: string
}

export const transcribeEpisode = task({
  id: 'transcribe-episode',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 60000,
    factor: 2,
  },
  run: async (payload: TranscribePayload) => {
    const { episodeId, taddyUuid, audioUrl, podcastId, podcastName, episodeName } = payload

    // Update transcript status to syncing
    await supabase
      .from('transcripts')
      .upsert({
        episode_id: episodeId,
        status: 'syncing',
        source: 'taddy',
      })

    let transcript: string
    let segments: Array<{ text: string; startTime: number; endTime: number; speaker: string | null }> = []
    let source: 'taddy' | 'deepgram' = 'taddy'

    try {
      // Try Taddy first
      const taddyResult = await getEpisodeTranscript(taddyUuid)
      
      if (taddyResult.taddyTranscribeStatus === 'COMPLETE' && taddyResult.transcript) {
        transcript = taddyResult.transcript
        segments = taddyResult.transcriptWithSpeakersAndTimecodes || []
      } else {
        // Fallback to Deepgram
        source = 'deepgram'
        const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
          { url: audioUrl },
          {
            model: 'nova-2',
            smart_format: true,
            diarize: true,
            punctuate: true,
            paragraphs: true,
            utterances: true,
          }
        )

        if (error) throw error

        transcript = result.results.channels[0].alternatives[0].transcript
        const utterances = result.results.channels[0].alternatives[0].utterances || []
        segments = utterances.map(u => ({
          text: u.transcript,
          startTime: u.start,
          endTime: u.end,
          speaker: u.speaker ? `Speaker ${u.speaker}` : null,
        }))
      }

      // Chunk transcript for embeddings
      const chunks = chunkTranscript(transcript, segments)

      // Generate embeddings
      const embeddings = await Promise.all(
        chunks.map(async (chunk) => {
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk.text,
          })
          return response.data[0].embedding
        })
      )

      // Store in ChromaDB
      const collection = await chroma.getOrCreateCollection({
        name: 'podcast-transcripts',
      })

      await collection.add({
        ids: chunks.map((_, i) => `${episodeId}-chunk-${i}`),
        embeddings,
        documents: chunks.map(c => c.text),
        metadatas: chunks.map((chunk, i) => ({
          episode_id: episodeId,
          podcast_id: podcastId,
          podcast_name: podcastName,
          episode_name: episodeName,
          chunk_index: i,
          start_time: chunk.startTime,
          end_time: chunk.endTime,
          speaker: chunk.speaker || '',
        })),
      })

      // Update transcript record
      await supabase
        .from('transcripts')
        .update({
          status: 'synced',
          source,
          full_text: transcript,
          chunk_count: chunks.length,
          chroma_collection_id: 'podcast-transcripts',
          updated_at: new Date().toISOString(),
        })
        .eq('episode_id', episodeId)

      return { success: true, chunkCount: chunks.length, source }
    } catch (error) {
      // Update transcript with error
      await supabase
        .from('transcripts')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('episode_id', episodeId)

      throw error
    }
  },
})

function chunkTranscript(
  fullText: string,
  segments: Array<{ text: string; startTime: number; endTime: number; speaker: string | null }>
) {
  const CHUNK_SIZE = 500 // tokens approximately
  const chunks: Array<{
    text: string
    startTime: number
    endTime: number
    speaker: string | null
  }> = []

  if (segments.length > 0) {
    // Use segments for better chunking with timestamps
    let currentChunk = ''
    let chunkStart = segments[0].startTime
    let chunkEnd = segments[0].endTime
    let chunkSpeaker = segments[0].speaker

    for (const segment of segments) {
      if (currentChunk.split(' ').length + segment.text.split(' ').length > CHUNK_SIZE) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          startTime: chunkStart,
          endTime: chunkEnd,
          speaker: chunkSpeaker,
        })
        // Start new chunk
        currentChunk = segment.text
        chunkStart = segment.startTime
        chunkEnd = segment.endTime
        chunkSpeaker = segment.speaker
      } else {
        currentChunk += ' ' + segment.text
        chunkEnd = segment.endTime
      }
    }

    // Don't forget last chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        startTime: chunkStart,
        endTime: chunkEnd,
        speaker: chunkSpeaker,
      })
    }
  } else {
    // Fallback: simple word-based chunking
    const words = fullText.split(' ')
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      chunks.push({
        text: words.slice(i, i + CHUNK_SIZE).join(' '),
        startTime: 0,
        endTime: 0,
        speaker: null,
      })
    }
  }

  return chunks
}
```

#### 3.3 Sync Episode Action

**File: `src/app/actions/sync.ts`**
```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'
import { transcribeEpisode } from '@/trigger/transcribe-episode'
import { revalidatePath } from 'next/cache'

const SUBSCRIPTION_LIMITS = {
  free: { podcasts: 3, syncs: 30, chats: 100 },
  pro: { podcasts: 25, syncs: 500, chats: Infinity },
  team: { podcasts: Infinity, syncs: Infinity, chats: Infinity },
}

export async function syncEpisode(episodeId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = await createServerSupabaseClient()

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier, monthly_sync_count, billing_cycle_start')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Check if we need to reset monthly count
  const cycleStart = new Date(profile.billing_cycle_start)
  const now = new Date()
  const daysSinceCycle = Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceCycle >= 30) {
    // Reset cycle
    await supabase
      .from('user_profiles')
      .update({
        monthly_sync_count: 0,
        billing_cycle_start: now.toISOString(),
      })
      .eq('id', profile.id)
    profile.monthly_sync_count = 0
  }

  // Check sync limit
  const tier = profile.subscription_tier as keyof typeof SUBSCRIPTION_LIMITS
  const limit = SUBSCRIPTION_LIMITS[tier].syncs

  if (profile.monthly_sync_count >= limit) {
    throw new Error(`Sync limit reached (${limit}/month). Upgrade for more.`)
  }

  // Get episode details
  const { data: episode } = await supabase
    .from('episodes')
    .select(`
      id,
      taddy_uuid,
      audio_url,
      name,
      podcast:podcasts(id, name, taddy_uuid)
    `)
    .eq('id', episodeId)
    .single()

  if (!episode) throw new Error('Episode not found')

  // Check if transcript already exists (deduplication)
  const { data: existingTranscript } = await supabase
    .from('transcripts')
    .select('id, status')
    .eq('episode_id', episodeId)
    .single()

  if (existingTranscript?.status === 'synced') {
    // Just link user to existing transcript (doesn't count against quota)
    await supabase.from('user_synced_episodes').upsert({
      user_id: profile.id,
      episode_id: episodeId,
    })

    revalidatePath(`/podcasts/${episode.podcast.id}`)
    return { success: true, instant: true }
  }

  // Create sync job
  const { data: syncJob } = await supabase
    .from('sync_jobs')
    .insert({
      user_id: profile.id,
      episode_id: episodeId,
      status: 'queued',
    })
    .select('id')
    .single()

  // Trigger background job
  const handle = await transcribeEpisode.trigger({
    episodeId: episode.id,
    taddyUuid: episode.taddy_uuid,
    audioUrl: episode.audio_url,
    podcastId: episode.podcast.id,
    podcastName: episode.podcast.name,
    episodeName: episode.name,
  })

  // Update sync job with trigger run ID
  await supabase
    .from('sync_jobs')
    .update({
      trigger_run_id: handle.id,
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', syncJob.id)

  // Increment sync count
  await supabase
    .from('user_profiles')
    .update({
      monthly_sync_count: profile.monthly_sync_count + 1,
    })
    .eq('id', profile.id)

  // Link user to episode
  await supabase.from('user_synced_episodes').upsert({
    user_id: profile.id,
    episode_id: episodeId,
  })

  revalidatePath(`/podcasts/${episode.podcast.id}`)
  return { success: true, runId: handle.id }
}
```

---

### Phase 4: AI Chat (Week 4)

#### 4.1 ChromaDB Client

**File: `src/lib/chromadb.ts`**
```typescript
import { ChromaClient } from 'chromadb'
import { OpenAI } from 'openai'

const chroma = new ChromaClient({
  path: process.env.CHROMA_URL || 'http://localhost:8000',
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function queryTranscripts(
  query: string,
  options: {
    episodeIds?: string[]
    podcastIds?: string[]
    nResults?: number
  } = {}
) {
  const { episodeIds, podcastIds, nResults = 10 } = options

  // Generate embedding for query
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })
  const queryEmbedding = response.data[0].embedding

  // Get collection
  const collection = await chroma.getCollection({
    name: 'podcast-transcripts',
  })

  // Build where filter
  let where: Record<string, any> | undefined
  if (episodeIds?.length) {
    where = { episode_id: { $in: episodeIds } }
  } else if (podcastIds?.length) {
    where = { podcast_id: { $in: podcastIds } }
  }

  // Query
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    where,
    include: ['documents', 'metadatas', 'distances'],
  })

  return results.documents[0].map((doc, i) => ({
    text: doc,
    metadata: results.metadatas![0][i] as {
      episode_id: string
      podcast_id: string
      podcast_name: string
      episode_name: string
      start_time: number
      end_time: number
      speaker: string
    },
    distance: results.distances![0][i],
  }))
}
```

#### 4.2 Chat API Route

**File: `src/app/api/chat/route.ts`**
```typescript
import { streamText, tool, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'
import { queryTranscripts } from '@/lib/chromadb'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, sessionId } = await req.json()

  const supabase = await createServerSupabaseClient()

  // Get session context
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('context_podcast_ids, context_episode_ids')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return new Response('Session not found', { status: 404 })
  }

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a helpful podcast assistant. You help users find and understand information from podcast transcripts.

When answering questions:
1. Always use the searchTranscripts tool to find relevant information
2. Cite your sources with episode name and timestamp
3. Be accurate and don't make up information not in the transcripts
4. If you can't find relevant information, say so honestly

Format citations as: [Episode Name @ MM:SS]`,
    messages: await convertToModelMessages(messages),
    tools: {
      searchTranscripts: tool({
        description: 'Search podcast transcripts for relevant information',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          const results = await queryTranscripts(query, {
            episodeIds: session.context_episode_ids,
            podcastIds: session.context_podcast_ids,
            nResults: 10,
          })

          return results.map(r => ({
            text: r.text,
            podcastName: r.metadata.podcast_name,
            episodeName: r.metadata.episode_name,
            timestamp: formatTimestamp(r.metadata.start_time),
          }))
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toDataStreamResponse()
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

#### 4.3 Chat Page

**File: `src/app/chat/[sessionId]/page.tsx`**
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'
import { ChatInterface } from '@/components/chat/chat-interface'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()

  // Get session with context
  const { data: session } = await supabase
    .from('chat_sessions')
    .select(`
      id,
      title,
      context_podcast_ids,
      context_episode_ids,
      created_at
    `)
    .eq('id', sessionId)
    .single()

  if (!session) {
    redirect('/library')
  }

  // Get previous messages
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface 
        sessionId={session.id}
        initialMessages={messages || []}
        contextPodcastIds={session.context_podcast_ids}
        contextEpisodeIds={session.context_episode_ids}
      />
    </div>
  )
}
```

#### 4.4 Chat Interface Component

**File: `src/components/chat/chat-interface.tsx`**
```typescript
'use client'

import { useChat } from '@ai-sdk/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { ChatMessage } from './chat-message'

interface ChatInterfaceProps {
  sessionId: string
  initialMessages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    citations?: any
  }>
  contextPodcastIds: string[]
  contextEpisodeIds: string[]
}

export function ChatInterface({
  sessionId,
  initialMessages,
  contextPodcastIds,
  contextEpisodeIds,
}: ChatInterfaceProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { sessionId },
    initialMessages: initialMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
  })

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about the podcast..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
```

---

### Phase 5: Polish (Week 5)

#### 5.1 Loading States & Skeletons

Add skeleton components for all async data loading.

#### 5.2 Error Handling

Implement error boundaries and user-friendly error messages.

#### 5.3 Mobile Responsiveness

Test and optimize all pages for mobile viewports.

#### 5.4 Performance Optimization

- Implement proper caching strategies
- Optimize database queries with indexes
- Add pagination for large data sets

#### 5.5 Testing

- Add unit tests for critical functions
- Add integration tests for API routes
- Add E2E tests for main user flows

---

## File Structure Summary

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── podcasts/
│   │   │   ├── search/route.ts
│   │   │   └── [id]/episodes/route.ts
│   │   └── webhooks/clerk/route.ts
│   ├── library/page.tsx
│   ├── podcasts/[id]/page.tsx
│   ├── chat/[sessionId]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # ShadCN components
│   ├── chat/
│   │   ├── chat-interface.tsx
│   │   └── chat-message.tsx
│   └── podcast/
│       ├── podcast-card.tsx
│       ├── episode-list.tsx
│       └── search-podcasts.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── clerk-server.ts
│   ├── taddy.ts
│   ├── chromadb.ts
│   └── utils.ts
├── actions/
│   ├── library.ts
│   └── sync.ts
├── trigger/
│   └── transcribe-episode.ts
└── middleware.ts

supabase/
├── config.toml
└── migrations/
    ├── 001_initial_schema.sql
    └── 002_rls_policies.sql

plans/
└── podcast-chat-implementation.md

trigger.config.ts
components.json
.env.example
```

---

## Acceptance Criteria

### Phase 1: Foundation
- [ ] ShadCN UI initialized with required components
- [ ] All dependencies installed
- [ ] Database migrations created and applied
- [ ] Environment variables template created
- [ ] Clerk + Supabase JWT integration working
- [ ] User profile created on sign-up
- [ ] Protected routes enforced

### Phase 2: Podcast Management
- [ ] Taddy API client functional
- [ ] Podcast search returns results
- [ ] Add to library creates proper records
- [ ] Library page displays user's podcasts
- [ ] Remove from library works correctly
- [ ] Subscription limits enforced

### Phase 3: Episodes & Sync
- [ ] Episode list loads with pagination
- [ ] Sync job queued successfully
- [ ] Taddy transcript fetch works
- [ ] Deepgram fallback works
- [ ] Chunks stored in ChromaDB
- [ ] Sync status updates in real-time
- [ ] Deduplication prevents duplicate work

### Phase 4: AI Chat
- [ ] Chat session created with context
- [ ] RAG retrieval finds relevant chunks
- [ ] Streaming responses work
- [ ] Citations included in responses
- [ ] Chat history persisted
- [ ] Message limits enforced

### Phase 5: Polish
- [ ] Loading states throughout app
- [ ] Error handling for all failure modes
- [ ] Mobile-responsive layouts
- [ ] Performance optimized
- [ ] Tests passing

---

## Known Gaps & Decisions Needed

1. **Dual Failure Recovery**: Define behavior when both Taddy and Deepgram fail
2. **Concurrent Sync Locking**: Implement PostgreSQL advisory locks
3. **Partial Sync Behavior**: Decide on behavior when exceeding quota
4. **Billing Cycle Reset**: Use UTC for all resets
5. **Downgrade Policy**: Grandfather existing podcasts
6. **Real-time Updates**: Use Supabase Realtime
7. **Context Size Limits**: Limit to 50 episodes maximum
8. **Credit Refund Policy**: Refund on API failures

---

## References

- [PRD.md](/Users/scottsowers/Documents/Github/podcast-chat/documenation/PRD.md)
- [TECH_STACK_DOCUMENTATION.md](/Users/scottsowers/Documents/Github/podcast-chat/documenation/TECH_STACK_DOCUMENTATION.md)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Vercel AI SDK](https://ai-sdk.dev/docs)
- [Trigger.dev Docs](https://trigger.dev/docs)
- [ChromaDB Docs](https://docs.trychroma.com/)
- [Deepgram Docs](https://developers.deepgram.com/)
