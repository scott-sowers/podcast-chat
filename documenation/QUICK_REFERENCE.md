# Quick Reference Guide

Essential links, installation commands, and code snippets for rapid development.

---

## Essential Links

### Official Documentation
- **Next.js 16**: https://nextjs.org/docs
- **Next.js 16 Upgrade Guide**: https://nextjs.org/docs/app/guides/upgrading/version-16
- **Supabase**: https://supabase.com/docs
- **Clerk (Auth)**: https://clerk.com/docs
- **Clerk + Supabase**: https://clerk.com/docs/guides/development/integrations/databases/supabase
- **ShadCN UI**: https://ui.shadcn.com/docs
- **AI Elements**: https://ai-sdk.dev/elements
- **Vercel AI SDK**: https://ai-sdk.dev/docs
- **ChromaDB**: https://docs.trychroma.com/
- **Deepgram**: https://developers.deepgram.com/
- **MCP**: https://modelcontextprotocol.io/
- **Trigger.dev**: https://trigger.dev/docs

### GitHub Repositories
- **AI Elements**: https://github.com/vercel/ai-elements
- **Deepgram SDK**: https://github.com/deepgram/deepgram-js-sdk
- **Chroma**: https://github.com/chroma-core/chroma
- **MCP TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **MCP Servers**: https://github.com/modelcontextprotocol/servers
- **Trigger.dev**: https://github.com/triggerdotdev/trigger.dev

---

## Installation Commands

### Create Next.js Project
```bash
npx create-next-app@latest podcast-chat --typescript --tailwind --app
cd podcast-chat
```

### Install Core Dependencies
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Clerk (Authentication & Multi-Tenancy)
npm install @clerk/nextjs

# AI SDK
npm install ai @ai-sdk/openai @ai-sdk/react @ai-sdk/mcp zod

# Vector Database
npm install chromadb @chroma-core/default-embed

# Audio Transcription
npm install @deepgram/sdk

# Background Jobs
npm install @trigger.dev/sdk @trigger.dev/nextjs

# Utilities
npm install class-variance-authority clsx tailwind-merge lucide-react

# React Compiler (optional but recommended for Next.js 16)
npm install -D babel-plugin-react-compiler
```

### Install UI Components
```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Install AI Elements
npx shadcn@latest add https://registry.ai-sdk.dev/all.json

# Install specific shadcn components
npx shadcn@latest add button card dialog input textarea
npx shadcn@latest add dropdown-menu select label
npx shadcn@latest add scroll-area separator skeleton
```

---

## Environment Variables

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# OpenAI
OPENAI_API_KEY=

# Chroma Cloud
CHROMA_CLOUD_URL=https://api.trychroma.com
CHROMA_API_KEY=
CHROMA_TENANT=
CHROMA_DATABASE=

# Deepgram
DEEPGRAM_API_KEY=

# Trigger.dev
TRIGGER_SECRET_KEY=
```

---

## Essential Code Snippets

### Clerk Setup

**Middleware (proxy.ts for Next.js 16):**
```typescript
// proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/podcasts(.*)'])

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

**Layout with ClerkProvider:**
```typescript
// app/layout.tsx
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="flex justify-end items-center p-4 gap-4">
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

**Server-Side Auth:**
```typescript
import { auth } from '@clerk/nextjs/server'

export default async function Page() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  // userId and orgId available for queries
}
```

### Supabase Client Setup

**Server Client (Next.js 16 - async cookies):**
```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Handle cookie errors in Server Components
          }
        },
      },
    }
  )
}
```

**Browser Client:**
```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Clerk + Supabase Integration

**Client-Side Supabase with Clerk Token:**
```typescript
// lib/supabase/clerk-client.ts
'use client'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

export function useSupabaseClient() {
  const { session } = useSession()
  return useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { accessToken: async () => session?.getToken() ?? null }
  ), [session])
}
```

**Server-Side Supabase with Clerk Token:**
```typescript
// lib/supabase/clerk-server.ts
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function createServerSupabaseClient() {
  const { getToken } = await auth()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { accessToken: async () => await getToken() ?? null }
  )
}
```

### AI Chat API Route

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

### Chat Component

```typescript
'use client'
import { useChat } from '@ai-sdk/react'
import { Conversation } from '@/components/ai-elements/conversation'
import { Message } from '@/components/ai-elements/message'
import { PromptInput } from '@/components/ai-elements/prompt-input'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div className="flex flex-col h-screen">
      <Conversation>
        {messages.map(m => (
          <Message key={m.id} role={m.role}>
            {m.content}
          </Message>
        ))}
      </Conversation>
      <PromptInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
```

### ChromaDB Setup

```typescript
import { ChromaClient } from 'chromadb'

const client = new ChromaClient({
  path: process.env.CHROMA_CLOUD_URL,
  auth: {
    provider: 'token',
    credentials: process.env.CHROMA_API_KEY,
  },
})

const collection = await client.getOrCreateCollection({
  name: 'podcasts',
})

// Add documents
await collection.add({
  ids: ['id1'],
  documents: ['Document text'],
  metadatas: [{ source: 'podcast' }],
})

// Query
const results = await collection.query({
  queryTexts: ['search query'],
  nResults: 5,
})
```

### Deepgram Transcription

```typescript
import { createClient } from '@deepgram/sdk'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY)

const { result } = await deepgram.listen.prerecorded.transcribeUrl(
  { url: 'https://audio-url.mp3' },
  {
    model: 'nova-2',
    smart_format: true,
    diarize: true,
  }
)

const transcript = result.results.channels[0].alternatives[0].transcript
```

### Trigger.dev Background Job

```typescript
// trigger/transcribe.ts
import { task } from '@trigger.dev/sdk/v3'
import { createClient } from '@deepgram/sdk'

export const transcribeAudio = task({
  id: 'transcribe-audio',
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { audioUrl: string; podcastId: string }) => {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

    const { result } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: payload.audioUrl },
      { model: 'nova-2', smart_format: true, diarize: true }
    )

    const transcript = result.results.channels[0].alternatives[0].transcript

    // Store in database, update status, etc.
    return { transcript, podcastId: payload.podcastId }
  },
})
```

**Trigger from API Route:**
```typescript
import { transcribeAudio } from '@/trigger/transcribe'

export async function POST(req: Request) {
  const { audioUrl, podcastId } = await req.json()

  const handle = await transcribeAudio.trigger({ audioUrl, podcastId })

  return Response.json({ runId: handle.id })
}
```

### Tool Calling

```typescript
import { tool } from 'ai'
import { z } from 'zod'

const tools = {
  searchPodcasts: tool({
    description: 'Search podcast transcripts',
    parameters: z.object({
      query: z.string(),
    }),
    execute: async ({ query }) => {
      // Implementation
      return { results: [] }
    },
  }),
}
```

### Server Actions (Next.js 16)

```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createPost(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: formData.get('title'),
      content: formData.get('content'),
    })

  if (error) throw error

  revalidatePath('/posts')
  return data
}
```

### RAG Pattern

```typescript
export async function POST(req: Request) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1].content

  // Search vector DB
  const results = await collection.query({
    queryTexts: [lastMessage],
    nResults: 3,
  })

  const context = results.documents[0].join('\n\n')

  // Stream with context
  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: `Context: ${context}`,
    messages,
  })

  return result.toDataStreamResponse()
}
```

---

## Common Patterns

### Protected Route with Supabase Auth (Server Component - Next.js 16)
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Protected content</div>
}
```

### Protected Route with Clerk Auth (Server Component)
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div>
      <p>User: {userId}</p>
      {orgId && <p>Organization: {orgId}</p>}
    </div>
  )
}
```

### Multi-Tenant Data Query (Clerk + Supabase)
```typescript
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'

export default async function PodcastsPage() {
  const { userId, orgId } = await auth()
  const supabase = await createServerSupabaseClient()

  // RLS policies auto-filter by org_id from Clerk JWT
  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('*')
    .order('created_at', { ascending: false })

  return <PodcastList podcasts={podcasts} />
}
```

### Page with Async Params (Next.js 16)
```typescript
// Next.js 16 requires async params and searchParams
export default async function Page(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ query?: string }>
}) {
  const { slug } = await props.params
  const { query } = await props.searchParams

  return <div>Slug: {slug}, Query: {query}</div>
}
```

### Loading States with Suspense
```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AsyncComponent />
    </Suspense>
  )
}

async function AsyncComponent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### Form with Server Action
```typescript
import { createPost } from './actions'

export default function Form() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

---

## Database Schema Examples

### Supabase Tables

**Podcasts:**
```sql
create table podcasts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  audio_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid references auth.users(id)
);

-- Enable RLS
alter table podcasts enable row level security;

-- Policy: Users can read all podcasts
create policy "Podcasts are viewable by everyone"
  on podcasts for select
  using (true);

-- Policy: Users can insert their own podcasts
create policy "Users can insert their own podcasts"
  on podcasts for insert
  with check (auth.uid() = user_id);
```

**Transcripts:**
```sql
create table transcripts (
  id uuid default gen_random_uuid() primary key,
  podcast_id uuid references podcasts(id) on delete cascade,
  transcript text not null,
  summary text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table transcripts enable row level security;

create policy "Transcripts are viewable by everyone"
  on transcripts for select
  using (true);
```

---

## Debugging Tips

### Check Supabase Connection
```typescript
const supabase = await createClient()
const { data, error } = await supabase.from('podcasts').select('count')
console.log('Connection:', error ? 'Failed' : 'Success')
```

### Debug AI Streaming
```typescript
const result = streamText({
  model: openai('gpt-4-turbo'),
  messages,
  onFinish: ({ text, usage }) => {
    console.log('Finished:', text)
    console.log('Tokens:', usage)
  },
})
```

### Check ChromaDB Connection
```typescript
const heartbeat = await client.heartbeat()
console.log('Chroma heartbeat:', heartbeat)
```

### Test Deepgram
```typescript
const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
  { url: 'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav' }
)
console.log('Deepgram:', error ? 'Failed' : 'Success')
```

---

## Performance Tips

1. **Turbopack is now default** in Next.js 16 - no flags needed for `next dev` or `next build`
2. **Implement Streaming** for AI responses to improve perceived performance
3. **Use Suspense Boundaries** strategically for optimal loading UX
4. **Enable Supabase Connection Pooling** for production
5. **Chunk Large Transcripts** before storing in vector database
6. **Use Server Components** by default, Client Components only when needed
7. **Enable React Compiler** for automatic memoization: `reactCompiler: true` in next.config
8. **Use Cache Components** with `"use cache"` directive for explicit caching control

---

## Deployment Checklist

- [ ] Set all environment variables in Vercel
- [ ] Configure Supabase production database
- [ ] Set up ChromaDB production instance
- [ ] Enable Supabase RLS policies
- [ ] Configure CORS for Supabase
- [ ] Test Deepgram API limits
- [ ] Set up error monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Test edge cases and error handling
- [ ] Set up CI/CD pipeline
- [ ] Ensure Node.js 20.9+ is used (required for Next.js 16)

---

## Useful CLI Commands

```bash
# Development (Turbopack is now default)
npm run dev

# Build (Turbopack is now default)
npm run build

# Use Webpack instead (if needed)
npm run build -- --webpack

# Type checking
npx tsc --noEmit

# Generate types for async params/searchParams
npx next typegen

# Lint (use ESLint directly in Next.js 16)
npx eslint .

# Format
npx prettier --write .

# Supabase (local)
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local

# Generate types from Supabase
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts

# Upgrade to Next.js 16
npx @next/codemod@canary upgrade latest
```

---

## Next.js 16 Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // React Compiler (stable in Next.js 16)
  reactCompiler: true,

  // Cache Components for PPR
  cacheComponents: true,

  // Turbopack config (now top-level, not experimental)
  turbopack: {
    // options
  },
}

export default nextConfig
```

---

## Version Compatibility Matrix

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.0+ | Requires Node.js 20.9+, React 19.2 |
| React | 19.2+ | View Transitions, Activity, useEffectEvent |
| Node.js | 20.9+ | Minimum version (Node 18 no longer supported) |
| TypeScript | 5.1+ | Minimum version |
| @clerk/nextjs | 6.0+ | Multi-tenant auth, Organizations |
| @supabase/ssr | 0.5+ | Replaces auth-helpers |
| ai | 4.2+ | Supports MCP |
| chromadb | 1.9+ | Latest features |
| @deepgram/sdk | 3.8+ | v3 architecture |
| @trigger.dev/sdk | 3.0+ | Background jobs |

---

## Next.js 16 Breaking Changes Summary

| Change | Migration |
|--------|-----------|
| Async `params`/`searchParams` | Use `await props.params` |
| Async `cookies()`/`headers()` | Use `await cookies()` |
| `middleware.ts` deprecated | Rename to `proxy.ts` |
| `next lint` removed | Use ESLint directly |
| Turbopack default | Use `--webpack` flag to opt out |
| `experimental.ppr` removed | Use `cacheComponents: true` |
| `images.minimumCacheTTL` default | Changed from 60s to 4 hours |

---

For detailed documentation, see [TECH_STACK_DOCUMENTATION.md](./TECH_STACK_DOCUMENTATION.md)
