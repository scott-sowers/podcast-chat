# Redesign App to Borrowed Brain Design

## Overview

Transform the authenticated app pages (`src/app/(app)`) from a basic podcast search/library interface into a premium, dark-first "Borrowed Brain" experience with left-hand navigation rail, dashboard-style layouts, chat interfaces, and persistent audio player.

## Problem Statement

The current app has:
- Horizontal top header navigation (not vertical rail)
- Light-first design with neutral grays
- Basic Library and Search pages only
- No chat interface for AI conversations
- No audio player for podcast playback
- No sync status indicators or progress flows

The Borrowed Brain Design Brief calls for:
- Dark-first UI with deep charcoal backgrounds
- Left-hand vertical navigation rail (icon-forward, persistent)
- Accent gradients (violet → amber) for featured content and CTAs
- Card-based dashboard layouts with generous padding
- Chat interface with source citations and timestamps
- Persistent mini audio player
- Transparent sync status indicators

## Technical Approach

### Architecture

The redesign restructures the app layout hierarchy:

```
src/app/
  layout.tsx                    # Root (ClerkProvider, AudioProvider, fonts)
  globals.css                   # Updated theme tokens + gradient utilities
  (app)/
    layout.tsx                  # Dashboard layout with NavigationRail + MiniPlayer
    page.tsx                    # Discover page (new home)
    library/page.tsx            # Redesigned library with sync status
    search/page.tsx             # Merged into Discover (remove or redirect)
    chat/
      page.tsx                  # Chat source selection
      [chatId]/page.tsx         # Active chat interface
    settings/page.tsx           # User settings
```

### Key Technical Decisions

1. **Navigation Rail**: Use shadcn/ui Sidebar component with `collapsible="icon"` for icon-forward collapsed state
2. **Audio Player**: React Context provider at root layout for global audio state persistence
3. **Dark Theme**: Set `dark` class on `<html>` element, update CSS custom properties for deep charcoal
4. **Gradients**: Add `@utility` classes in Tailwind CSS 4 for violet → amber accent gradients
5. **Chat**: Use Vercel AI SDK's `useChat` hook with citation display components

## Implementation Phases

### Phase 1: Foundation - Theme & Layout

Update the visual foundation and navigation structure.

#### 1.1 Update Theme Tokens

**File: `src/app/globals.css`**

```css
/* Update :root and .dark with new color tokens */
:root {
    /* Keep for potential light mode toggle */
    --radius: 0.75rem;  /* Increase from 0.625rem */
}

.dark {
    /* Deep charcoal backgrounds */
    --background: oklch(0.12 0.01 250);
    --foreground: oklch(0.95 0 0);
    --card: oklch(0.16 0.01 250);
    --card-foreground: oklch(0.95 0 0);
    --muted: oklch(0.22 0.01 250);
    --muted-foreground: oklch(0.65 0 0);
    --border: oklch(0.25 0.02 250);
    
    /* Accent colors */
    --accent-violet: oklch(0.65 0.25 290);
    --accent-amber: oklch(0.75 0.18 85);
    --primary: oklch(0.65 0.22 290);
    --primary-foreground: oklch(0.98 0 0);
}

/* Gradient utilities */
@utility gradient-accent {
    background: linear-gradient(135deg, var(--accent-violet), var(--accent-amber));
}

@utility gradient-accent-hover {
    background: linear-gradient(135deg, oklch(0.60 0.25 290), oklch(0.70 0.18 85));
}

@utility gradient-text {
    background: linear-gradient(135deg, var(--accent-violet), var(--accent-amber));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Generous spacing utilities */
@utility section-padding {
    padding: 2rem;
}

@utility card-padding {
    padding: 1.5rem;
}
```

#### 1.2 Install shadcn/ui Sidebar

```bash
pnpm dlx shadcn@latest add sidebar
```

#### 1.3 Create Navigation Rail Component

**File: `src/components/navigation-rail.tsx`**

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Library, MessageSquare, Settings, Headphones } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserButton } from "@clerk/nextjs"

const navItems = [
  { title: "Discover", href: "/", icon: Home },
  { title: "Library", href: "/library", icon: Library },
  { title: "Chats", href: "/chat", icon: MessageSquare },
]

export function NavigationRail() {
  const pathname = usePathname()
  const { state } = useSidebar()
  
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-accent flex items-center justify-center">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          {state === "expanded" && (
            <span className="font-semibold gradient-text">Borrowed Brain</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenuButton asChild tooltip="Settings">
          <Link href="/settings">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
        <div className="mt-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
```

#### 1.4 Update App Layout

**File: `src/app/(app)/layout.tsx`**

```tsx
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { NavigationRail } from "@/components/navigation-rail"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen bg-background">
        <NavigationRail />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6">
            <SidebarTrigger className="-ml-2" />
          </header>
          <main className="flex-1 p-6 pb-24">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
```

#### 1.5 Set Dark Mode as Default

**File: `src/app/layout.tsx`**

Update the `<html>` tag:

```tsx
<html lang="en" className="dark">
```

---

### Phase 2: Discover Page

Create the new home/discover page with featured content and search.

#### 2.1 Create Discover Page

**File: `src/app/(app)/page.tsx`**

```tsx
import { Suspense } from "react"
import { SearchInput } from "@/components/podcasts/search-input"
import { FeaturedPodcast } from "@/components/discover/featured-podcast"
import { CuratedCollections } from "@/components/discover/curated-collections"
import { SearchResults } from "@/components/discover/search-results"

export default function DiscoverPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Discover</h1>
        <p className="text-muted-foreground mt-1">
          Find podcasts to add to your borrowed brain
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl">
        <SearchInput placeholder="Search podcasts, hosts, topics..." />
      </div>

      {query ? (
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <>
          {/* Featured */}
          <section>
            <h2 className="text-xl font-medium mb-4">Featured</h2>
            <FeaturedPodcast />
          </section>

          {/* Collections */}
          <section>
            <h2 className="text-xl font-medium mb-4">Curated Collections</h2>
            <CuratedCollections />
          </section>
        </>
      )}
    </div>
  )
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  )
}
```

#### 2.2 Featured Podcast Component

**File: `src/components/discover/featured-podcast.tsx`**

```tsx
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Play } from "lucide-react"

export function FeaturedPodcast() {
  // TODO: Fetch featured podcast from API/database
  const featured = {
    id: "featured-1",
    name: "Huberman Lab",
    author: "Dr. Andrew Huberman",
    description: "Discusses science and science-based tools for everyday life.",
    image_url: "/placeholder-podcast.jpg",
    total_episodes: 200,
  }

  return (
    <div className="relative overflow-hidden rounded-2xl gradient-accent p-[1px]">
      <div className="bg-card rounded-2xl p-6 flex gap-6">
        <div className="relative h-40 w-40 shrink-0 rounded-xl overflow-hidden">
          <Image
            src={featured.image_url}
            alt={featured.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-between flex-1">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Featured Podcast</p>
            <h3 className="text-2xl font-semibold">{featured.name}</h3>
            <p className="text-muted-foreground">{featured.author}</p>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {featured.description}
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button className="gradient-accent hover:gradient-accent-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add to Library
            </Button>
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 2.3 Curated Collections Component

**File: `src/components/discover/curated-collections.tsx`**

```tsx
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const collections = [
  { id: "tech", title: "Tech & Startups", count: 12 },
  { id: "science", title: "Science & Health", count: 8 },
  { id: "business", title: "Business & Finance", count: 15 },
  { id: "creativity", title: "Creativity & Design", count: 6 },
]

export function CuratedCollections() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {collections.map((collection) => (
        <Link key={collection.id} href={`/discover?collection=${collection.id}`}>
          <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{collection.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {collection.count} podcasts
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

---

### Phase 3: Library Redesign with Sync Status

Redesign the library page with sync status indicators.

#### 3.1 Create Sync Status Component

**File: `src/components/ui/sync-status.tsx`**

```tsx
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react"

type SyncStatus = "not_synced" | "syncing" | "partially_synced" | "fully_synced" | "error"

interface SyncStatusProps {
  status: SyncStatus
  progress?: number
  lastSyncDate?: Date
  className?: string
}

const statusConfig = {
  not_synced: { icon: Clock, label: "Not synced", color: "text-muted-foreground", bg: "bg-muted" },
  syncing: { icon: Loader2, label: "Syncing", color: "text-blue-500", bg: "bg-blue-500/10", animate: true },
  partially_synced: { icon: CheckCircle2, label: "Partially synced", color: "text-amber-500", bg: "bg-amber-500/10" },
  fully_synced: { icon: CheckCircle2, label: "Fully synced", color: "text-green-500", bg: "bg-green-500/10" },
  error: { icon: AlertCircle, label: "Sync failed", color: "text-destructive", bg: "bg-destructive/10" },
}

export function SyncStatus({ status, progress, lastSyncDate, className }: SyncStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.bg, config.color)}>
        <Icon className={cn("h-3.5 w-3.5", config.animate && "animate-spin")} />
        <span>{config.label}</span>
        {progress !== undefined && status === "syncing" && (
          <span>({progress}%)</span>
        )}
      </div>
      {lastSyncDate && status !== "not_synced" && status !== "syncing" && (
        <span className="text-xs text-muted-foreground">
          {lastSyncDate.toLocaleDateString()}
        </span>
      )}
    </div>
  )
}
```

#### 3.2 Update Podcast Card with Sync Status

**File: `src/components/podcasts/podcast-card.tsx`**

Update to include sync status badge and actions:

```tsx
// Add SyncStatus import and display
// Add sync action buttons: "Sync All", "Sync Episodes", "Chat"
// Update styling for dark theme with generous padding
```

#### 3.3 Redesign Library Page

**File: `src/app/(app)/library/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useLibrary } from "@/hooks/use-library"
import { PodcastCard } from "@/components/podcasts/podcast-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function LibraryPage() {
  const { podcasts, isLoading } = useLibrary()
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")

  const filteredPodcasts = podcasts?.filter((podcast) => {
    const matchesFilter = filter === "all" || podcast.syncStatus === filter
    const matchesSearch = podcast.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Library</h1>
          <p className="text-muted-foreground mt-1">
            {podcasts?.length || 0} podcasts in your borrowed brain
          </p>
        </div>
        <Button asChild className="gradient-accent hover:gradient-accent-hover">
          <Link href="/">
            <Plus className="h-4 w-4 mr-2" />
            Add Podcasts
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All podcasts</SelectItem>
            <SelectItem value="fully_synced">Fully synced</SelectItem>
            <SelectItem value="partially_synced">Partially synced</SelectItem>
            <SelectItem value="not_synced">Not synced</SelectItem>
            <SelectItem value="syncing">Syncing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Podcast Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : filteredPodcasts?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No podcasts found</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/">Discover podcasts to add</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPodcasts?.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### Phase 4: Sync Flow Modal

Create the sync flow with progress steps.

#### 4.1 Create Sync Modal Component

**File: `src/components/sync/sync-modal.tsx`**

```tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"

type SyncScope = "all" | "range" | "single"
type SyncStep = "select" | "transcribing" | "chunking" | "embedding" | "complete"

interface SyncModalProps {
  podcast: { id: string; name: string; totalEpisodes: number }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  { id: "transcribing", label: "Transcribing audio" },
  { id: "chunking", label: "Chunking content" },
  { id: "embedding", label: "Creating embeddings" },
]

export function SyncModal({ podcast, open, onOpenChange }: SyncModalProps) {
  const [scope, setScope] = useState<SyncScope>("all")
  const [currentStep, setCurrentStep] = useState<SyncStep>("select")
  const [progress, setProgress] = useState(0)

  const handleStartSync = async () => {
    setCurrentStep("transcribing")
    // TODO: Trigger Trigger.dev job and subscribe to progress
  }

  const isProcessing = currentStep !== "select" && currentStep !== "complete"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync {podcast.name}</DialogTitle>
          <DialogDescription>
            {currentStep === "select" && "Choose what to sync to your borrowed brain"}
            {isProcessing && "Syncing in progress..."}
            {currentStep === "complete" && "Ready to chat!"}
          </DialogDescription>
        </DialogHeader>

        {currentStep === "select" && (
          <div className="space-y-6">
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as SyncScope)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex-1 cursor-pointer">
                  <span className="font-medium">Entire podcast</span>
                  <span className="block text-sm text-muted-foreground">
                    All {podcast.totalEpisodes} episodes
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range" className="flex-1 cursor-pointer">
                  <span className="font-medium">Episode range</span>
                  <span className="block text-sm text-muted-foreground">
                    Select specific episodes
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex-1 cursor-pointer">
                  <span className="font-medium">Single episode</span>
                  <span className="block text-sm text-muted-foreground">
                    Just one episode
                  </span>
                </Label>
              </div>
            </RadioGroup>

            <Button onClick={handleStartSync} className="w-full gradient-accent">
              Start Sync
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-6">
            <div className="space-y-4">
              {steps.map((step, index) => {
                const stepIndex = steps.findIndex((s) => s.id === currentStep)
                const isComplete = index < stepIndex
                const isCurrent = step.id === currentStep
                
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isComplete ? "bg-green-500" : isCurrent ? "bg-primary" : "bg-muted"
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <span className="text-sm text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <span className={isCurrent ? "font-medium" : "text-muted-foreground"}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>
        )}

        {currentStep === "complete" && (
          <div className="space-y-6 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Sync complete!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your podcast is ready to chat with
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Start Chatting
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### Phase 5: Chat Interface

Create the chat page with source selection and citations.

#### 5.1 Create Chat Page

**File: `src/app/(app)/chat/page.tsx`**

```tsx
import Link from "next/link"
import { getChatHistory } from "@/lib/chat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MessageSquare } from "lucide-react"

export default async function ChatPage() {
  const chats = await getChatHistory()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Chats</h1>
          <p className="text-muted-foreground mt-1">
            Conversations with your borrowed brain
          </p>
        </div>
        <Button asChild className="gradient-accent">
          <Link href="/chat/new">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Link>
        </Button>
      </div>

      {chats.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/chat/new">Start your first chat</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {/* Podcast avatars */}
                    <span>{chat.title}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {chat.lastMessage} • {chat.updatedAt}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### 5.2 Create Chat Interface Component

**File: `src/components/chat/chat-interface.tsx`**

```tsx
"use client"

import { useChat } from "@ai-sdk/react"
import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./chat-message"
import { SuggestedPrompts } from "./suggested-prompts"
import { Send, Loader2 } from "lucide-react"

interface ChatInterfaceProps {
  chatId: string
  podcastIds: string[]
}

export function ChatInterface({ chatId, podcastIds }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    id: chatId,
    body: { podcastIds },
  })

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSuggestedPrompt = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">What would you like to know?</h2>
              <p className="text-muted-foreground mb-6">
                Ask questions about your synced podcasts
              </p>
              <SuggestedPrompts onSelect={handleSuggestedPrompt} />
            </div>
          )}
          
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background/80 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your podcasts..."
            className="min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
```

#### 5.3 Create Chat Message with Citations

**File: `src/components/chat/chat-message.tsx`**

```tsx
import { cn } from "@/lib/utils"
import { Citation } from "./citation"
import type { Message } from "ai"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary" : "gradient-accent"
      )}>
        <span className="text-xs text-white font-medium">
          {isUser ? "U" : "AI"}
        </span>
      </div>

      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser ? "bg-primary text-primary-foreground" : "bg-card border"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Citations - only for AI messages */}
        {!isUser && message.annotations?.citations && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Sources:</span>
            {message.annotations.citations.map((citation: any, i: number) => (
              <Citation key={i} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 5.4 Create Citation Component

**File: `src/components/chat/citation.tsx`**

```tsx
"use client"

import { Clock, ExternalLink } from "lucide-react"
import { useAudio } from "@/providers/audio-provider"

interface CitationData {
  episodeId: string
  episodeTitle: string
  podcastName: string
  timestamp: string
  text: string
}

export function Citation({ citation }: { citation: CitationData }) {
  const { play } = useAudio()

  const handleClick = () => {
    // TODO: Load episode and seek to timestamp
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-muted text-left transition-colors w-full"
    >
      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs font-medium text-primary">{citation.timestamp}</span>
      <span className="text-xs text-muted-foreground">|</span>
      <span className="text-xs truncate flex-1">{citation.episodeTitle}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
    </button>
  )
}
```

---

### Phase 6: Audio Player

Create the persistent mini audio player.

#### 6.1 Create Audio Provider

**File: `src/providers/audio-provider.tsx`**

```tsx
"use client"

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react"

interface Episode {
  id: string
  title: string
  podcastName: string
  audioUrl: string
  artworkUrl?: string
  duration: number
}

interface AudioContextType {
  currentEpisode: Episode | null
  isPlaying: boolean
  currentTime: number
  duration: number
  play: (episode: Episode) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  skipForward: (seconds?: number) => void
  skipBackward: (seconds?: number) => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    audioRef.current = new Audio()
    const audio = audioRef.current

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime))
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration))
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.pause()
      audio.src = ""
    }
  }, [])

  const play = useCallback((episode: Episode) => {
    if (!audioRef.current) return
    audioRef.current.src = episode.audioUrl
    audioRef.current.play()
    setCurrentEpisode(episode)
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play()
    setIsPlaying(true)
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time
  }, [])

  const skipForward = useCallback((seconds = 30) => {
    if (audioRef.current) audioRef.current.currentTime += seconds
  }, [])

  const skipBackward = useCallback((seconds = 15) => {
    if (audioRef.current) audioRef.current.currentTime -= seconds
  }, [])

  return (
    <AudioContext.Provider value={{
      currentEpisode,
      isPlaying,
      currentTime,
      duration,
      play,
      pause,
      resume,
      seek,
      skipForward,
      skipBackward,
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) throw new Error("useAudio must be used within AudioProvider")
  return context
}
```

#### 6.2 Create Mini Player Component

**File: `src/components/audio/mini-player.tsx`**

```tsx
"use client"

import Image from "next/image"
import { useAudio } from "@/providers/audio-provider"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, MessageSquare } from "lucide-react"
import Link from "next/link"

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function MiniPlayer() {
  const { currentEpisode, isPlaying, currentTime, duration, pause, resume, seek, skipForward, skipBackward } = useAudio()

  if (!currentEpisode) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t">
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="container flex items-center gap-4 h-20 px-4">
        {/* Episode info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {currentEpisode.artworkUrl && (
            <Image
              src={currentEpisode.artworkUrl}
              alt={currentEpisode.title}
              width={48}
              height={48}
              className="rounded-lg"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{currentEpisode.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentEpisode.podcastName}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => skipBackward(15)} className="h-9 w-9">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="default" size="icon" onClick={() => isPlaying ? pause() : resume()} className="h-10 w-10 rounded-full">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => skipForward(30)} className="h-9 w-9">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time + Ask */}
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-xs text-muted-foreground w-20">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/chat/new?episode=${currentEpisode.id}&timestamp=${Math.floor(currentTime)}`}>
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Ask about this
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### 6.3 Add Audio Provider and Player to Layout

**File: `src/app/layout.tsx`**

```tsx
import { AudioProvider } from "@/providers/audio-provider"
import { MiniPlayer } from "@/components/audio/mini-player"

// Wrap children with AudioProvider
// Add MiniPlayer before closing body tag
```

---

## Acceptance Criteria

### Visual Design
- [ ] Dark theme is default with deep charcoal backgrounds
- [ ] Accent gradients (violet → amber) applied to CTAs and featured content
- [ ] Cards have generous padding (1.5rem+) and rounded corners (0.75rem+)
- [ ] Typography uses clean hierarchy with muted secondary text

### Navigation
- [ ] Left-hand vertical navigation rail is persistent
- [ ] Navigation is icon-forward with tooltips on collapsed state
- [ ] Active state clearly indicates current page
- [ ] User avatar/button accessible from navigation

### Discover Page
- [ ] Featured podcast card with gradient border
- [ ] Curated collections grid
- [ ] Search functionality that queries podcast API
- [ ] "Add to Library" CTA on search results

### Library Page
- [ ] Podcast cards display sync status badges
- [ ] Filter by sync status (all, synced, not synced, syncing)
- [ ] Search within library
- [ ] Sync action buttons on cards

### Sync Flow
- [ ] Modal for scope selection (all, range, single)
- [ ] Progress steps: Transcribing → Chunking → Embedding
- [ ] Real-time progress percentage
- [ ] Completion confirmation with "Start Chatting" CTA

### Chat Interface
- [ ] Source selection for new chats
- [ ] Message display with user/AI distinction
- [ ] Citation display with timestamp and episode title
- [ ] Clickable citations that link to audio player
- [ ] Suggested prompts for empty state

### Audio Player
- [ ] Persistent mini player at bottom
- [ ] Play/pause, skip forward/backward controls
- [ ] Progress bar with current/total time
- [ ] "Ask about this" button linking to chat
- [ ] Player persists across page navigation

## Dependencies

### New shadcn/ui Components
```bash
pnpm dlx shadcn@latest add sidebar dialog radio-group progress scroll-area slider textarea
```

### Database Schema Additions
- `sync_status` enum on podcasts table
- `last_synced_at` timestamp on podcasts table
- `chats` table for chat history
- `messages` table for chat messages
- `citations` table for message citations

## References

### Internal
- Current globals.css: `src/app/globals.css`
- Current app layout: `src/app/(app)/layout.tsx`
- Current library page: `src/app/(app)/library/page.tsx`
- Podcast card: `src/components/podcasts/podcast-card.tsx`
- Design brief: `documenation/Borrowed_Brain_Design_Brief.md`

### External
- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [Tailwind CSS 4 Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Vercel AI SDK useChat](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat)
- [Clerk Theming](https://clerk.com/docs/customization/themes)
