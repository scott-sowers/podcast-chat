
# Borrowed Brain — Product & Design Brief

## Product Overview
**Borrowed Brain** is a podcast chat application that allows users to:
- Add podcasts to a personal library
- Sync individual episodes or entire podcast feeds into a vector database
- Chat with one or multiple podcasts as if they were a “borrowed brain”

The product blends podcast discovery, knowledge management, and conversational AI in a calm, premium, dark-mode-first interface.

---

## Core User Jobs
1. Discover insightful podcasts
2. Save and organize podcasts into a personal library
3. Ingest podcast knowledge transparently (episodes → vectors)
4. Ask questions and synthesize ideas across podcasts
5. Return to conversations as persistent knowledge artifacts

---

## Target Users
- Founders, operators, and knowledge workers
- Podcast power listeners
- AI-curious lifelong learners
- Users who value transparency and source attribution

---

## Brand Personality
Borrowed Brain should feel:
- Thoughtful and intelligent
- Calm and focused
- Premium but approachable
- Trustworthy and private

Avoid:
- Gimmicky AI metaphors
- Overly playful visuals
- Opaque or “magic” behaviors

---

## Visual Language

### Theme & Color
- Dark-first UI
- Deep charcoal backgrounds
- Soft contrast
- Accent gradients (violet → amber) used sparingly for:
  - Featured content
  - Primary CTAs
  - Active states

### Typography
- Clean, modern sans-serif
- Clear hierarchy:
  - Editorial headlines
  - Medium-weight section headers
  - Muted secondary metadata

### Layout
- Dashboard-style canvas
- Left-hand vertical navigation rail
- Card-based sections with generous padding
- Rounded corners and subtle elevation

---

## Primary Navigation
Left rail navigation:
- Home / Discover
- Library
- Chats
- Following (optional / v2)
- Downloads / Offline (optional)
- Profile & Settings

Navigation should be persistent, icon-forward, and unobtrusive.

---

## Key Screens

### Discover
**Purpose:** Inspiration without overload.

Components:
- Featured podcast or theme card
- Curated collections
- Creator or podcast rankings
- Search (podcast, host, topics)

Primary CTA:
- “Add to Library”

---

### Library
**Purpose:** Ownership and control.

Podcast cards display:
- Artwork
- Podcast title and host
- Sync status:
  - Not synced
  - Partially synced
  - Fully synced
- Last sync date

Actions:
- Sync entire podcast
- Sync selected episodes
- Remove from library

---

### Sync Flow (Critical UX)
**Purpose:** Build trust in AI ingestion.

Steps:
1. Choose scope (episode / range / entire podcast)
2. Show progress:
   - Transcribing
   - Chunking
   - Embedding
3. Confirm completion (“Ready to chat”)

Rule:
> Users should always know what the AI knows.

---

### Chat Interface (Core Experience)

#### Single-Podcast Chat
- Chat header shows podcast name and artwork
- Clear context label (“You’re chatting with…”)
- Source-aware answers with citations, timestamps, and excerpts

#### Multi-Podcast Chat
- Header displays multiple podcast avatars
- Responses synthesize across sources
- Inline citations grouped by podcast

Input enhancements:
- Suggested prompts
- Follow-up question chips

---

### Audio + Knowledge Hybrid
- Persistent mini audio player
- Transcript highlighting during playback
- “Ask about this” shortcut from active audio
- Chat context can reference current playback

---

## Authentication & Identity
- **Clerk.dev** for:
  - Email and OAuth authentication
  - Session management
  - User profiles

Profiles include:
- Name and avatar
- Library statistics
- Sync usage

Auth should feel fast and invisible.

---

## AI & Vector UX Principles
- Clearly communicate indexed content
- Show last sync timestamps
- Never imply full knowledge when scope is partial
- Expose chat context boundaries

---

## Accessibility & Usability
- High contrast text
- Keyboard-navigable chat
- Clear focus states
- No reliance on color alone for meaning

---

## Success Metrics
- Time to first successful chat
- Percentage of users syncing multiple podcasts
- Repeat chat sessions per library item
- Depth of follow-up questioning

---

## Product Promise
> **Borrowed Brain lets you think with the minds you already listen to.**
