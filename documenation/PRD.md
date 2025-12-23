# Product Requirements Document: Podcast Chat

## Overview

Podcast Chat is a web application that enables users to have AI-powered conversations with podcast content. Users can search for podcasts, add them to their library, sync episode transcripts, and chat with the content using natural language queries.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Success Metrics](#goals--success-metrics)
3. [User Personas](#user-personas)
4. [Core Features](#core-features)
5. [Technical Architecture](#technical-architecture)
6. [Data Models](#data-models)
7. [API Specifications](#api-specifications)
8. [User Flows](#user-flows)
9. [Non-Functional Requirements](#non-functional-requirements)
10. [Future Considerations](#future-considerations)

---

## Problem Statement

Podcasts contain valuable information, but that content is locked in audio format. Users cannot easily:
- Search for specific topics discussed across episodes
- Reference past conversations or quotes
- Get quick answers without listening to full episodes
- Cross-reference information across multiple podcasts

Podcast Chat solves this by transcribing podcast episodes and enabling AI-powered chat interactions with the content.

---

## Goals & Success Metrics

### Goals

1. **Accessibility**: Make podcast content searchable and queryable
2. **Efficiency**: Save users time by surfacing relevant information instantly
3. **Discovery**: Help users find connections across podcast episodes
4. **Simplicity**: Provide an intuitive interface for managing podcasts and chatting

### Success Metrics

| Metric | Target |
|--------|--------|
| User retention (30-day) | > 40% |
| Episodes synced per user | > 20 |
| Chat sessions per week per user | > 5 |
| Average chat session length | > 3 messages |
| Transcript sync success rate | > 95% |

---

## User Personas

### Primary: Knowledge Worker

- **Profile**: Professional who listens to industry podcasts for learning
- **Pain Points**: Can't remember which episode covered a topic, no time to re-listen
- **Goals**: Quick reference to podcast content, find specific quotes/information

### Secondary: Podcast Enthusiast

- **Profile**: Avid podcast listener with 10+ subscribed shows
- **Pain Points**: Content overload, losing track of insights from episodes
- **Goals**: Organize and recall information from favorite shows

### Tertiary: Researcher/Content Creator

- **Profile**: Creates content or conducts research using podcast sources
- **Pain Points**: Difficult to cite podcasts, time-consuming to find quotes
- **Goals**: Accurate transcripts, easy citation, cross-referencing

---

## Core Features

### F1: User Authentication & Billing Management

**Description**: Secure user authentication and subscription management via Clerk.

**Requirements**:

| ID | Requirement | Priority |
|----|-------------|----------|
| F1.1 | Users can sign up with email, Google, or GitHub | P0 |
| F1.2 | Users can sign in and sign out | P0 |
| F1.3 | Users can view and manage their subscription | P0 |
| F1.4 | Users can update billing information | P0 |
| F1.5 | Users can upgrade/downgrade subscription tiers | P1 |
| F1.6 | System enforces usage limits based on subscription tier | P0 |

**Subscription Tiers**:

| Tier | Price | Podcasts | Episodes/mo | Chat Messages/mo |
|------|-------|----------|-------------|------------------|
| Free | $0 | 3 | 30 | 100 |
| Pro | $12/mo | 25 | 500 | Unlimited |
| Team | $29/mo | Unlimited | Unlimited | Unlimited |

---

### F2: Podcast Search & Discovery

**Description**: Users can search for podcasts using the Taddy API and add them to their library.

**Requirements**:

| ID | Requirement | Priority |
|----|-------------|----------|
| F2.1 | Users can search podcasts by name, topic, or keyword | P0 |
| F2.2 | Search results display podcast name, artwork, author, and episode count | P0 |
| F2.3 | Users can view podcast details before adding | P1 |
| F2.4 | Users can add a podcast to their library from search results | P0 |
| F2.5 | System prevents duplicate podcast additions | P0 |
| F2.6 | Search supports pagination for large result sets | P1 |

**Search Result Display**:
```
┌─────────────────────────────────────────────────────┐
│ 🎙️ [Podcast Artwork]                                │
│                                                     │
│ Podcast Name                                        │
│ By Author Name                                      │
│ 245 episodes • Technology                           │
│                                                     │
│ Brief description of the podcast...                 │
│                                                     │
│                              [View Details] [+ Add] │
└─────────────────────────────────────────────────────┘
```

---

### F3: Podcast Library Management

**Description**: Users can view, manage, and remove podcasts from their personal library.

**Requirements**:

| ID | Requirement | Priority |
|----|-------------|----------|
| F3.1 | Users can view all podcasts in their library | P0 |
| F3.2 | Library displays sync status for each podcast | P0 |
| F3.3 | Users can remove a podcast from their library | P0 |
| F3.4 | Removing a podcast removes user association but preserves shared transcripts | P0 |
| F3.5 | Library shows episode count (total and synced) per podcast | P1 |
| F3.6 | Users can sort library by name, date added, or sync status | P2 |

---

### F4: Episode Browsing & Management

**Description**: Users can browse all episodes of a podcast and manage sync status.

**Requirements**:

| ID | Requirement | Priority |
|----|-------------|----------|
| F4.1 | Users can view paginated list of all episodes for a podcast | P0 |
| F4.2 | Episode list displays title, date, duration, and sync status | P0 |
| F4.3 | Users can scroll/paginate through episodes (infinite scroll or pagination) | P0 |
| F4.4 | Episodes sorted by publish date (newest first by default) | P0 |
| F4.5 | Users can search/filter episodes within a podcast | P2 |
| F4.6 | Episode details show description and chapter information | P1 |

**Episode List Display**:
```
┌─────────────────────────────────────────────────────┐
│ Episode 245: The Future of AI                       │
│ Dec 15, 2024 • 58 min                              │
│ ✅ Synced                           [Sync] [Chat]  │
├─────────────────────────────────────────────────────┤
│ Episode 244: Year in Review                         │
│ Dec 8, 2024 • 72 min                               │
│ ⏳ Syncing...                                       │
├─────────────────────────────────────────────────────┤
│ Episode 243: Interview with...                      │
│ Dec 1, 2024 • 45 min                               │
│ ○ Not synced                        [Sync] [Chat]  │
└─────────────────────────────────────────────────────┘
```

---

### F5: Episode Transcript Sync

**Description**: Users can sync episode transcripts to enable chat functionality. Transcripts are stored once globally and shared across users.

**Requirements**:

| ID | Requirement | Priority |
|----|-------------|----------|
| F5.1 | Users can sync all episodes of a podcast at once | P0 |
| F5.2 | Users can sync individual episodes | P0 |
| F5.3 | Sync first attempts Taddy transcript, falls back to Deepgram | P0 |
| F5.4 | Transcripts are chunked and stored in Chroma with embeddings | P0 |
| F5.5 | System checks if transcript already exists before syncing | P0 |
| F5.6 | If transcript exists in Chroma, skip re-upload (deduplication) | P0 |
| F5.7 | Sync status is tracked and displayed to users | P0 |
| F5.8 | Sync runs as background job via Trigger.dev | P0 |
| F5.9 | Users receive notification when sync completes | P1 |
| F5.10 | Failed syncs can be retried | P1 |

**Sync States**:
- `not_synced` - Transcript not yet processed
- `queued` - Sync job queued
- `syncing` - Transcript being processed
- `synced` - Transcript available in Chroma
- `failed` - Sync failed (with error reason)

**Deduplication Logic**:
```
1. User requests episode sync
2. Check if episode UUID exists in global transcripts table
3. If exists AND status = 'synced':
   a. Link user to existing transcript
   b. Skip Chroma upload
   c. Mark user's episode as synced
4. If not exists OR status = 'failed':
   a. Create/update transcript record
   b. Fetch transcript (Taddy → Deepgram fallback)
   c. Chunk and embed transcript
   d. Upload to Chroma
   e. Update transcript status
   f. Link user to transcript
```

---

### F6: AI Chat with Podcasts

**Description**: Users can have AI-powered conversations with their synced podcast content, similar to adding files to context in Claude.

**Requirements**:

| ID | Requirement | Priority |
|----|-------------|----------|
| F6.1 | Users can start a new chat session | P0 |
| F6.2 | Users can select which podcasts/episodes to include in chat context | P0 |
| F6.3 | Chat interface supports adding/removing context sources mid-conversation | P0 |
| F6.4 | System retrieves relevant transcript chunks via RAG | P0 |
| F6.5 | AI responses include citations with episode and timestamp | P0 |
| F6.6 | Chat supports streaming responses | P0 |
| F6.7 | Users can view chat history | P1 |
| F6.8 | Users can continue previous chat sessions | P1 |
| F6.9 | Chat respects subscription tier message limits | P0 |

**Chat Context Selection**:
```
┌─────────────────────────────────────────────────────┐
│ Chat Context                                    [+] │
├─────────────────────────────────────────────────────┤
│ 📚 All from: Tech Podcast (245 episodes)        [x] │
│ 📄 Ep 42: AI Deep Dive                          [x] │
│ 📄 Ep 18: Machine Learning Basics               [x] │
│                                                     │
│ [+ Add podcasts or episodes to context]            │
└─────────────────────────────────────────────────────┘
```

**Citation Format**:
```
Based on the discussion in "Tech Podcast - Episode 42: AI Deep Dive" 
[12:34], the speaker mentioned that...

---
Sources:
• Tech Podcast, Ep 42 "AI Deep Dive" @ 12:34
• Tech Podcast, Ep 18 "ML Basics" @ 45:12
```

---

## Technical Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                           Frontend                                │
│                     Next.js 15 + React 19                        │
│              ShadCN UI + AI SDK UI Components                    │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API Layer                                 │
│                   Next.js API Routes                             │
│              Server Actions + Server Components                   │
└──────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Clerk     │ │  Supabase   │ │   Chroma    │ │ Trigger.dev │
│   Auth &    │ │  Database   │ │   Vector    │ │  Background │
│   Billing   │ │  + Storage  │ │   Store     │ │    Jobs     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────┐
                        │    External APIs        │
                        │  • Taddy (Podcasts)     │
                        │  • Deepgram (Transcribe)│
                        │  • OpenAI (LLM + Embed) │
                        └─────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15, React 19 | App framework |
| UI Components | ShadCN UI, AI SDK Elements | Interface components |
| Styling | Tailwind CSS | Utility-first CSS |
| Authentication | Clerk | User auth & billing |
| Database | Supabase (PostgreSQL) | Relational data |
| Vector Store | Chroma Cloud | Embeddings & RAG |
| Background Jobs | Trigger.dev | Async processing |
| Podcast Data | Taddy API | Podcast search & metadata |
| Transcription | Taddy / Deepgram | Audio to text |
| AI/LLM | OpenAI (GPT-4) | Chat completions |
| Embeddings | OpenAI | Text embeddings |

---

## Data Models

### Supabase Schema

```sql
-- Users are managed by Clerk, we store additional metadata
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  monthly_chat_count INTEGER DEFAULT 0,
  monthly_sync_count INTEGER DEFAULT 0,
  billing_cycle_start TIMESTAMPTZ,
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
  chroma_collection_id TEXT, -- Reference to Chroma collection
  source TEXT NOT NULL, -- 'taddy' or 'deepgram'
  status TEXT DEFAULT 'not_synced', -- not_synced, queued, syncing, synced, failed
  error_message TEXT,
  full_text TEXT, -- Store full transcript for backup/display
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
  context_podcast_ids UUID[], -- Podcasts included in context
  context_episode_ids UUID[], -- Specific episodes included
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  citations JSONB, -- Array of {episode_id, timestamp, text}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync jobs tracking
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  trigger_run_id TEXT, -- Trigger.dev run ID
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_synced_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can manage own podcasts" ON user_podcasts
  FOR ALL USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Podcasts and episodes are publicly readable (shared resources)
-- Transcripts are publicly readable but only system can write
```

### Chroma Schema

```
Collection: podcast_transcripts

Document Schema:
{
  id: string,              // Unique chunk ID
  embedding: float[],      // OpenAI embedding vector
  metadata: {
    episode_uuid: string,  // Taddy episode UUID
    podcast_uuid: string,  // Taddy podcast UUID
    podcast_name: string,
    episode_name: string,
    chunk_index: number,
    start_time: number,    // Seconds
    end_time: number,      // Seconds
    speaker: string,       // If available
  },
  document: string         // Transcript chunk text
}
```

---

## API Specifications

### Podcast Endpoints

```typescript
// Search podcasts
GET /api/podcasts/search?q={term}&page={page}&limit={limit}
Response: {
  podcasts: PodcastSeries[],
  totalResults: number,
  page: number
}

// Get podcast details
GET /api/podcasts/{podcastId}
Response: PodcastSeries

// Add podcast to library
POST /api/podcasts/{podcastId}/add
Response: { success: boolean, podcast: UserPodcast }

// Remove podcast from library
DELETE /api/podcasts/{podcastId}
Response: { success: boolean }

// Get user's podcast library
GET /api/library
Response: { podcasts: UserPodcast[] }
```

### Episode Endpoints

```typescript
// Get episodes for a podcast
GET /api/podcasts/{podcastId}/episodes?page={page}&limit={limit}
Response: {
  episodes: Episode[],
  totalEpisodes: number,
  page: number
}

// Get episode details
GET /api/episodes/{episodeId}
Response: Episode

// Sync single episode
POST /api/episodes/{episodeId}/sync
Response: { success: boolean, jobId: string }

// Sync all episodes for a podcast
POST /api/podcasts/{podcastId}/sync-all
Response: { success: boolean, jobIds: string[] }

// Get sync status
GET /api/sync/{jobId}
Response: { status: string, progress: number }
```

### Chat Endpoints

```typescript
// Create chat session
POST /api/chat/sessions
Body: {
  podcastIds?: string[],
  episodeIds?: string[]
}
Response: { sessionId: string }

// Send message (streaming)
POST /api/chat/sessions/{sessionId}/messages
Body: { content: string }
Response: ReadableStream<ChatMessage>

// Update chat context
PATCH /api/chat/sessions/{sessionId}/context
Body: {
  addPodcastIds?: string[],
  removePodcastIds?: string[],
  addEpisodeIds?: string[],
  removeEpisodeIds?: string[]
}
Response: { success: boolean }

// Get chat history
GET /api/chat/sessions/{sessionId}/messages
Response: { messages: ChatMessage[] }

// List user's chat sessions
GET /api/chat/sessions
Response: { sessions: ChatSession[] }
```

---

## User Flows

### Flow 1: New User Onboarding

```
1. User visits landing page
2. User clicks "Get Started"
3. Clerk sign-up modal appears
4. User signs up with email/Google/GitHub
5. User profile created in Supabase
6. User redirected to empty library with onboarding prompt
7. Prompt guides user to search for first podcast
```

### Flow 2: Add Podcast to Library

```
1. User clicks "Add Podcast" or uses search bar
2. User enters search term
3. System calls Taddy API for results
4. Results displayed with pagination
5. User clicks "Add" on desired podcast
6. System checks if podcast exists in global registry
   a. If not, creates podcast record
7. System creates user_podcast association
8. Podcast appears in user's library
9. User prompted to sync episodes
```

### Flow 3: Sync Episodes

```
1. User navigates to podcast in library
2. User clicks "Sync All" or "Sync" on individual episode
3. System checks subscription limits
4. System creates sync_job record
5. Trigger.dev job queued
6. For each episode:
   a. Check if transcript exists in transcripts table
   b. If synced: link user to existing transcript
   c. If not: fetch transcript (Taddy → Deepgram)
   d. Chunk transcript into segments
   e. Generate embeddings via OpenAI
   f. Upload to Chroma
   g. Update transcript status
   h. Create user_synced_episode record
7. User sees real-time status updates
8. Notification on completion
```

### Flow 4: Chat with Podcast Content

```
1. User clicks "Chat" on podcast or episode
2. New chat session created with context
3. Chat interface opens with context panel
4. User can add/remove podcasts/episodes from context
5. User types question
6. System:
   a. Generates embedding for query
   b. Queries Chroma for relevant chunks
   c. Filters by user's selected context
   d. Constructs prompt with context
   e. Calls OpenAI with streaming
   f. Streams response with citations
7. Response displayed with source links
8. Chat history saved
```

### Flow 5: Remove Podcast

```
1. User navigates to podcast in library
2. User clicks "Remove from Library"
3. Confirmation modal appears
4. User confirms removal
5. System deletes user_podcast record
6. System deletes user_synced_episodes for that podcast
7. Podcast removed from user's library view
8. Global podcast/transcript data preserved for other users
```

---

## Non-Functional Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| Search response time | < 500ms |
| Chat first token latency | < 1s |
| Episode list load time | < 1s |
| Transcript sync time | < 2min per episode |
| RAG retrieval latency | < 200ms |

### Scalability

- Support 10,000+ concurrent users
- Handle 1M+ episodes in Chroma
- Support 100+ sync jobs running concurrently

### Security

- All API endpoints authenticated via Clerk
- Row Level Security on all user data
- API keys stored in environment variables
- No PII stored in Chroma (only content + metadata)
- HTTPS only

### Reliability

- 99.9% uptime target
- Automatic retry for failed sync jobs
- Graceful degradation if external APIs unavailable
- Database backups every 6 hours

---

## Future Considerations

### Phase 2 Features

- **Podcast Recommendations**: Suggest podcasts based on listening/chat history
- **Collaborative Libraries**: Share podcast collections with team members
- **Export Transcripts**: Download transcripts as PDF/text
- **Audio Playback**: Play episode at cited timestamp
- **Custom Collections**: Organize podcasts into folders/tags
- **API Access**: Developer API for integrations

### Phase 3 Features

- **Mobile App**: iOS/Android native apps
- **Browser Extension**: Add podcasts from podcast platforms
- **Slack/Discord Integration**: Chat with podcasts in team channels
- **Advanced Analytics**: Usage insights and listening patterns
- **Multi-language Support**: Transcription and chat in multiple languages

---

## Appendix

### A. Subscription Tier Comparison

| Feature | Free | Pro | Team |
|---------|------|-----|------|
| Podcasts in library | 3 | 25 | Unlimited |
| Episode syncs/month | 30 | 500 | Unlimited |
| Chat messages/month | 100 | Unlimited | Unlimited |
| Chat history retention | 7 days | 90 days | Unlimited |
| Priority sync queue | No | Yes | Yes |
| Team members | 1 | 1 | 10 |
| API access | No | No | Yes |
| Support | Community | Email | Priority |

### B. Error Handling

| Error Code | Description | User Message |
|------------|-------------|--------------|
| PODCAST_NOT_FOUND | Podcast not in Taddy | "Podcast not found. Try a different search." |
| SYNC_LIMIT_REACHED | Monthly sync limit hit | "You've reached your sync limit. Upgrade for more." |
| TRANSCRIPT_UNAVAILABLE | No transcript source | "Transcript unavailable for this episode." |
| CHAT_LIMIT_REACHED | Monthly chat limit hit | "You've reached your chat limit. Upgrade for more." |
| CONTEXT_TOO_LARGE | Too many episodes in context | "Too many episodes selected. Remove some to continue." |

### C. Glossary

| Term | Definition |
|------|------------|
| Sync | Process of fetching transcript and storing in vector database |
| Context | The podcasts/episodes included in a chat session for RAG |
| RAG | Retrieval Augmented Generation - using relevant content to enhance AI responses |
| Chunk | A segment of transcript (typically 500-1000 tokens) stored as a vector |
| Citation | Reference to specific episode and timestamp in AI response |
