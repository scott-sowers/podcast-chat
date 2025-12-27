# Phase 1: Minimal Redesign - Theme, Navigation, Library

## Overview

A minimal, shippable phase focused on visual foundation only. No new features, no speculative UI, no backend dependencies.

**Scope:**
- Dark theme as default
- Left sidebar navigation (plain CSS, no shadcn Sidebar)
- Restyled Library page with updated cards
- Redirect `/search` to `/` (Discover becomes home with search)

**Out of scope (deferred to Phase 2+):**
- Audio player
- Chat interface
- Sync flow modal
- Featured/curated content
- Citations

---

## Implementation Steps

### Step 1: Set Dark Theme as Default

**File: `src/app/layout.tsx`**

Add `dark` class to html element:

```tsx
<html lang="en" className="dark">
```

**File: `src/app/globals.css`**

Update dark theme colors for deeper charcoal (minimal changes):

```css
.dark {
    --background: oklch(0.13 0 0);        /* Deeper charcoal */
    --card: oklch(0.17 0 0);              /* Slightly lighter */
    --border: oklch(0.25 0 0);            /* Subtle borders */
}

/* Add single gradient utility for CTAs */
@utility gradient-accent {
    background: linear-gradient(135deg, oklch(0.65 0.25 290), oklch(0.75 0.18 85));
}
```

**Why minimal:** Only 4 CSS variable changes + 1 utility. No OKLCH overhaul needed.

---

### Step 2: Create Simple Sidebar Navigation

**File: `src/components/sidebar-nav.tsx`** (new)

Plain CSS sidebar, no shadcn complexity:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Library, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserButton } from "@clerk/nextjs"

const navItems = [
  { href: "/", icon: Home, label: "Discover" },
  { href: "/library", icon: Library, label: "Library" },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2 z-40">
      {/* Logo */}
      <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center mb-4">
        <span className="text-white font-bold text-sm">BB</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="flex flex-col gap-2 items-center">
        <Link
          href="/settings"
          className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  )
}
```

**Why minimal:** ~60 lines, plain Tailwind, no external dependencies, no collapse logic.

---

### Step 3: Update App Layout

**File: `src/app/(app)/layout.tsx`**

Replace horizontal header with sidebar:

```tsx
import { SidebarNav } from "@/components/sidebar-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <main className="ml-16 min-h-screen">
        <div className="max-w-6xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
```

**Why minimal:** Removes header complexity, simple left margin for sidebar.

---

### Step 4: Merge Search into Discover (Home)

**File: `src/app/(app)/page.tsx`** (new - replace or rename)

Move search functionality to home page:

```tsx
import { Suspense } from "react"
import { SearchSection } from "@/components/discover/search-section"

export default function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Discover</h1>
        <p className="text-muted-foreground mt-1">
          Search and add podcasts to your library
        </p>
      </div>

      <Suspense fallback={<div className="h-12 bg-muted rounded-lg animate-pulse" />}>
        <SearchSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
```

**File: `src/components/discover/search-section.tsx`** (new)

Server component that handles search params:

```tsx
import { SearchInput } from "@/components/podcasts/search-input"
import { PodcastCard } from "@/components/podcasts/podcast-card"
import { searchPodcasts } from "@/app/actions/podcast"

interface SearchSectionProps {
  searchParams: Promise<{ q?: string }>
}

export async function SearchSection({ searchParams }: SearchSectionProps) {
  const { q } = await searchParams
  const results = q ? await searchPodcasts(q) : null

  return (
    <div className="space-y-6">
      <SearchForm initialQuery={q} />
      
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((podcast) => (
            <PodcastCard key={podcast.id} {...podcast} />
          ))}
        </div>
      )}
      
      {q && results?.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No podcasts found for "{q}"
        </p>
      )}
    </div>
  )
}

// Client component for form
"use client"
function SearchForm({ initialQuery }: { initialQuery?: string }) {
  return (
    <form action="/" method="get" className="max-w-xl">
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search podcasts, hosts, topics..."
          className="flex-1 h-11 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="h-11 px-6 rounded-lg gradient-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>
    </form>
  )
}
```

**Why minimal:** Uses existing `searchPodcasts` action, form with GET (no client state), server-rendered results.

---

### Step 5: Redirect /search to /

**File: `src/app/(app)/search/page.tsx`**

Replace with redirect:

```tsx
import { redirect } from "next/navigation"

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q
  redirect(query ? `/?q=${encodeURIComponent(query)}` : "/")
}
```

**Why minimal:** Preserves existing URLs, no breaking changes.

---

### Step 6: Restyle Library Page

**File: `src/app/(app)/library/page.tsx`**

Simplify and restyle (keep existing data fetching logic):

```tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getUserPodcasts, removeFromLibrary } from "@/app/actions/podcast"
import { PodcastCard } from "@/components/podcasts/podcast-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function LibraryPage() {
  const [podcasts, setPodcasts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function load() {
      const data = await getUserPodcasts()
      setPodcasts(data)
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = podcasts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleRemove = async (id: string) => {
    await removeFromLibrary(id)
    setPodcasts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Library</h1>
          <p className="text-muted-foreground mt-1">
            {podcasts.length} podcast{podcasts.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Button asChild className="gradient-accent border-0">
          <Link href="/">
            <Plus className="h-4 w-4 mr-2" />
            Add Podcasts
          </Link>
        </Button>
      </div>

      {/* Search */}
      {podcasts.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          {podcasts.length === 0 ? (
            <>
              <p className="text-muted-foreground">Your library is empty</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/">Discover podcasts to add</Link>
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">No podcasts match "{search}"</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              {...podcast}
              isInLibrary={true}
              onRemove={() => handleRemove(podcast.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Why minimal:** Keeps existing logic, just cleaner layout and styling.

---

### Step 7: Update PodcastCard Styling

**File: `src/components/podcasts/podcast-card.tsx`**

Update card styling for dark theme (keep existing props/logic):

```tsx
// Update the Card className:
<Card className="overflow-hidden bg-card/50 border-border/50 hover:border-border transition-colors">

// Update CardContent padding:
<CardContent className="p-4">

// Update CardFooter:
<CardFooter className="p-4 pt-0 flex gap-2">
```

**Why minimal:** ~3 className changes, no prop changes.

---

## Files Changed Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/app/layout.tsx` | Edit | 1 line (add `dark` class) |
| `src/app/globals.css` | Edit | ~10 lines (4 vars + 1 utility) |
| `src/components/sidebar-nav.tsx` | Create | ~60 lines |
| `src/app/(app)/layout.tsx` | Edit | ~15 lines (replace header) |
| `src/app/(app)/page.tsx` | Create/Replace | ~30 lines |
| `src/components/discover/search-section.tsx` | Create | ~50 lines |
| `src/app/(app)/search/page.tsx` | Edit | ~10 lines (redirect) |
| `src/app/(app)/library/page.tsx` | Edit | ~80 lines (restyle) |
| `src/components/podcasts/podcast-card.tsx` | Edit | ~5 lines (classNames) |

**Total: ~260 lines of changes** (vs ~900+ in original plan)

---

## Acceptance Criteria

- [ ] App loads with dark theme by default
- [ ] Left sidebar visible with Discover, Library, Settings icons
- [ ] Active nav item highlighted
- [ ] User avatar visible in sidebar
- [ ] Home page (`/`) shows search functionality
- [ ] Search results display in grid
- [ ] `/search?q=...` redirects to `/?q=...`
- [ ] Library page displays saved podcasts
- [ ] Library search filters podcasts
- [ ] Cards have updated dark theme styling
- [ ] Gradient accent on primary CTAs

---

## What's Deferred

| Feature | Reason | When to Add |
|---------|--------|-------------|
| Audio player | No audio URLs in data yet | Phase 2: After episodes have audio |
| Chat interface | RAG pipeline not ready | Phase 2: After vector DB + embeddings |
| Sync flow modal | Background jobs not implemented | Phase 2: After Trigger.dev integration |
| Sync status badges | No sync_status column exists | Phase 2: After DB migration |
| Featured/Curated content | No curation system | Phase 3: After admin tooling |
| Multi-podcast chat | Complex UX | Phase 3: After single chat works |
| Citations with timestamps | Requires chunk metadata | Phase 3: After RAG returns sources |

---

## Next Steps After Phase 1

1. **Database migration**: Add `sync_status` enum and `last_synced_at` to podcasts
2. **Trigger.dev jobs**: Implement sync pipeline (transcribe → chunk → embed)
3. **Phase 2 plan**: Audio player + basic sync button + sync status badges
