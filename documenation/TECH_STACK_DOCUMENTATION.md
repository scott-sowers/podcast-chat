# Tech Stack Documentation

Complete documentation for the Podcast Chat application stack. Start with [Quick Start](#quick-start) to get running quickly, then refer to detailed sections as needed.

---

## Table of Contents

### Quick Start
- [Essential Links](#essential-links)
- [Installation](#installation)
- [Environment Variables](#environment-variables-quick-start)
- [Essential Code Snippets](#essential-code-snippets)

### Detailed Documentation

1. [Next.js 16 - App Router](#nextjs-16---app-router)
2. [Supabase](#supabase)
3. [Clerk (Authentication)](#clerk-authentication)
4. [Taddy API (Podcast Data)](#taddy-api-podcast-data)
5. [ShadCN UI](#shadcn-ui)
6. [AI Elements Registry](#ai-elements-registry)
7. [Vercel AI SDK](#vercel-ai-sdk)
8. [Trigger.dev](#triggerdev)
9. [Chroma Cloud](#chroma-cloud)
10. [Deepgram](#deepgram)
11. [Model Context Protocol (MCP)](#model-context-protocol-mcp)

---

# Quick Start

Get up and running quickly with essential links, commands, and code snippets.

## Essential Links

### Official Documentation
| Technology | Documentation |
|------------|---------------|
| Next.js 16 | https://nextjs.org/docs |
| Supabase | https://supabase.com/docs |
| Clerk | https://clerk.com/docs |
| Taddy API | https://taddy.org/developers |
| AI SDK | https://ai-sdk.dev/docs |
| ShadCN UI | https://ui.shadcn.com/docs |
| ChromaDB | https://docs.trychroma.com/ |
| Deepgram | https://developers.deepgram.com/ |
| Trigger.dev | https://trigger.dev/docs |

## Installation

```bash
# Create Next.js project
npx create-next-app@latest podcast-chat --typescript --tailwind --app
cd podcast-chat

# Core dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add @clerk/nextjs
pnpm add ai @ai-sdk/openai @ai-sdk/react
pnpm add chromadb
pnpm add @deepgram/sdk
pnpm add @trigger.dev/sdk @trigger.dev/nextjs
pnpm add zod

# UI components
npx shadcn@latest init
npx shadcn@latest add button card dialog input textarea scroll-area
```

## Environment Variables (Quick Start)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Taddy
TADDY_USER_ID=
TADDY_API_KEY=

# OpenAI
OPENAI_API_KEY=

# Chroma Cloud
CHROMA_CLOUD_URL=https://api.trychroma.com
CHROMA_API_KEY=

# Deepgram
DEEPGRAM_API_KEY=

# Trigger.dev
TRIGGER_SECRET_KEY=
```

## Essential Code Snippets

### Clerk Middleware (proxy.ts)
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/library(.*)', '/podcasts(.*)', '/chat(.*)',
  '/api/chat(.*)', '/api/podcasts(.*)', '/api/episodes(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
```

### Supabase Server Client
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
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

### Clerk + Supabase Integration
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

### Taddy GraphQL Client
```typescript
// lib/taddy.ts
export async function taddyQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch('https://api.taddy.org', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-USER-ID': process.env.TADDY_USER_ID!,
      'X-API-KEY': process.env.TADDY_API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  })
  const { data, errors } = await res.json()
  if (errors) throw new Error(errors[0].message)
  return data
}
```

### AI Chat API Route
```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({ model: openai('gpt-4-turbo'), messages })
  return result.toDataStreamResponse()
}
```

### Chat Component
```typescript
'use client'
import { useChat } from '@ai-sdk/react'

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.role}: {m.content}</div>)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  )
}
```

### Protected Page Pattern
```typescript
// app/library/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/clerk-server'

export default async function LibraryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createServerSupabaseClient()
  const { data: podcasts } = await supabase
    .from('user_podcasts')
    .select('*, podcast:podcasts(*)')
    .order('added_at', { ascending: false })

  return <PodcastLibrary podcasts={podcasts} />
}
```

### Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.0+ | Node.js 20.9+ required |
| React | 19.2+ | |
| @clerk/nextjs | 6.0+ | |
| @supabase/ssr | 0.5+ | |
| ai | 4.2+ | |

---

# Detailed Documentation

---

## Next.js 16 - App Router

### Version Information
- **Current Version**: Next.js 16.1 (as of December 2025)
- **React Version**: React 19.2
- **Node.js**: 20.9+ required (Node 18 no longer supported)
- **TypeScript**: 5.1+ required
- **Key Features**: Cache Components, Turbopack default, React Compiler stable

### Official Documentation
- **Main Docs**: https://nextjs.org/docs
- **App Router Docs**: https://nextjs.org/docs/app
- **Getting Started**: https://nextjs.org/docs/app/getting-started
- **Guides**: https://nextjs.org/docs/app/guides
- **What's New in 16**: https://nextjs.org/blog/next-16
- **Upgrade Guide**: https://nextjs.org/docs/app/guides/upgrading/version-16

### App Router Fundamentals

The App Router is a file-system based router using React's latest features:
- Server Components (default)
- Server Actions
- Streaming with Suspense
- Nested layouts
- Route handlers

**Basic File Structure:**
```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx           # Home page
├── api/
│   └── route.ts      # API route handler
└── [dynamic]/
    └── page.tsx      # Dynamic route
```

### Server Actions

**Official Docs**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

#### What are Server Actions?
"An asynchronous function that runs on the server" and can be invoked from the client via network requests.

#### Creating Server Actions

**File-level declaration:**
```typescript
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  // ... database operations
  revalidatePath('/posts')
  redirect('/posts')
}
```

**Function-level declaration:**
```typescript
export default function MyComponent() {
  async function handleSubmit() {
    'use server'
    // Server-side logic
  }

  return <form action={handleSubmit}>...</form>
}
```

**In Client Components:**
```typescript
// actions.ts
'use server'
export async function myAction(data: FormData) {
  // server logic
}

// client-component.tsx
'use client'
import { myAction } from './actions'

export default function Form() {
  return <form action={myAction}>...</form>
}
```

#### Invocation Methods

1. **Forms** - Using HTML `<form>` with the `action` prop
2. **Event Handlers** - Using `onClick` or similar handlers
3. **useEffect** - Triggering on component mount or dependency changes

#### Best Practices

- Automatically use HTTP POST method
- Use `useActionState` hook for pending states
- Call `refresh()` to update current page data
- Use `revalidatePath()` or `revalidateTag()` to refresh cached data
- Use `redirect()` to navigate users post-update
- Manipulate cookies with `cookies()` API

**Example with Progressive Enhancement:**
```typescript
import { createPost } from './actions'

export default function PostForm() {
  return (
    <form action={createPost}>
      <input type="text" name="title" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

### Streaming

**Official Docs**: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

#### How Streaming Works

Next.js progressively streams HTML from the server so parts of your page can render and appear as soon as they're ready. Streaming is a data transfer technique that breaks down a route into smaller "chunks" and progressively streams them from the server to the client.

#### Benefits

- Reduces Time To First Byte (TTFB)
- Reduces First Contentful Paint (FCP)
- Improves Time to Interactive (TTI), especially on slower devices
- Prevents long data requests from blocking page rendering

#### Implementation Methods

**1. Automatic Streaming with loading.tsx:**
```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}

// app/dashboard/page.tsx
export default async function Dashboard() {
  const data = await fetchData() // This will be streamed
  return <DashboardContent data={data} />
}
```

**2. Manual Streaming with Suspense:**
```typescript
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <SlowComponent />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <AnotherSlowComponent />
      </Suspense>
    </div>
  )
}

async function SlowComponent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

#### Best Practices

- Place Suspense boundaries strategically based on your application needs
- Move data fetches down to components that need them
- Wrap those components in Suspense
- You can stream sections or the whole page depending on requirements

### Edge Runtime

**Official Docs**: https://nextjs.org/docs/app/api-reference/edge

#### What is Edge Runtime?

A lightweight runtime that is a subset of available Node.js APIs. Ideal for delivering dynamic, personalized content at low latency with small, simple functions.

#### Important Update (Next.js 16)

**Middleware Renamed to Proxy!**

In Next.js 16, `middleware.ts` is deprecated and replaced by `proxy.ts`. The proxy runs on Node.js runtime by default (not Edge):

```typescript
// proxy.ts (replaces middleware.ts)
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Runs on Node.js runtime - you can use Node.js APIs
  return NextResponse.next();
}

// Note: If you need Edge runtime, continue using middleware.ts
// Edge runtime in proxy is not supported
```

#### Edge Runtime Limitations

- Cannot read or write to filesystem
- Cannot call `require` directly (must use ES Modules)
- Native Node.js APIs are not supported
- No Incremental Static Regeneration (ISR)
- node_modules can be used if they implement ES Modules and don't use native Node.js APIs

#### When to Use Each Runtime

**Edge Runtime:**
- Low-latency responses
- Small, simple functions
- Geographically distributed execution
- WebSocket connections

**Node.js Runtime:**
- Need Node.js-specific libraries (crypto, jsonwebtoken, etc.)
- Complex business logic
- Database connections with Node.js drivers
- File system operations

#### Using Runtime in Routes

```typescript
// app/api/hello/route.ts
// Note: In Next.js 16, 'nodejs' is the default runtime
export const runtime = 'edge' // or 'nodejs' (default)

export async function GET(request: Request) {
  return new Response('Hello from Edge!')
}
```

#### Using Runtime in Pages

```typescript
// app/page.tsx
// Edge runtime for pages - use sparingly due to limitations
export const runtime = 'edge'

export default function Page() {
  return <div>Edge-rendered page</div>
}
```

### Server Components vs Client Components

**Server Components (default):**
- Fetch data on the server
- Access backend resources directly
- Keep sensitive information secure
- Keep large dependencies on the server
- No JavaScript shipped to client

**Client Components:**
```typescript
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Configuration

**next.config.ts Example (Next.js 16):**
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // React Compiler (stable in Next.js 16)
  reactCompiler: true,

  // Cache Components for PPR
  cacheComponents: true,

  // Turbopack config (now top-level, not experimental)
  turbopack: {
    // Turbopack options
  },

  // Server Actions config
  serverActions: {
    bodySizeLimit: '2mb',
    allowedOrigins: ['my-proxy.com']
  },
}

export default nextConfig
```

### Next.js 16 Breaking Changes Summary

| Change | Migration |
|--------|-----------|
| Async `params`/`searchParams` | Use `await props.params` |
| Async `cookies()`/`headers()` | Use `await cookies()` |
| `middleware.ts` deprecated | Rename to `proxy.ts` |
| `next lint` removed | Use ESLint directly |
| Turbopack default | Use `--webpack` flag to opt out |
| Node.js 20.9+ required | Update Node.js version |
| `experimental.ppr` removed | Use `cacheComponents: true` |

---

## Supabase

### Version Information
- **Current SDK**: supabase-js v2
- **SSR Package**: @supabase/ssr

### Official Documentation
- **Main Docs**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript/introduction
- **Auth**: https://supabase.com/docs/guides/auth
- **Database**: https://supabase.com/docs/guides/database
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Realtime**: https://supabase.com/docs/guides/realtime
- **Cron**: https://supabase.com/docs/guides/cron
- **Next.js Integration**: https://supabase.com/docs/guides/auth/server-side/nextjs

### Installation

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Next.js Integration Setup

#### 1. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 2. Client Utility Functions

**Server Component Client (Next.js 16 - async cookies):**
```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Next.js 16: cookies() is now async
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

**Client Component Client:**
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

#### 3. Proxy for Token Refresh (Next.js 16)

```typescript
// proxy.ts (replaces middleware.ts in Next.js 16)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Authentication

#### Sign Up

**Server Action (Next.js 16 - async createClient):**
```typescript
'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath, redirect } from 'next/cache'

export async function signUp(formData: FormData) {
  // Next.js 16: createClient is now async
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
```

**Client Component:**
```typescript
'use client'
import { createClient } from '@/utils/supabase/client'

export default function SignUp() {
  const supabase = createClient()

  async function handleSignUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
  }

  // ... form implementation
}
```

#### Sign In Methods

**Email/Password:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'your-password',
})
```

**OAuth:**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback',
  },
})
```

**Magic Link:**
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'example@email.com',
})
```

#### Get Current User

**In Server Component:**
```typescript
import { createClient } from '@/utils/supabase/server'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <div>Hello {user?.email}</div>
}
```

**In Client Component:**
```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Profile() {
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  return <div>Hello {user?.email}</div>
}
```

### Database Operations

#### Select Data

```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10)
```

#### Insert Data

```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    title: 'Hello World',
    content: 'My first post',
    user_id: user.id,
  })
  .select()
```

#### Update Data

```typescript
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated Title' })
  .eq('id', postId)
```

#### Delete Data

```typescript
const { data, error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

#### Complex Queries with Joins

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    author:user_id(name, avatar_url),
    comments(count)
  `)
  .eq('published', true)
```

### Edge Functions

**Official Docs**: https://supabase.com/docs/guides/functions

#### Creating an Edge Function

```bash
supabase functions new hello-world
```

**Function Code (Deno):**
```typescript
// supabase/functions/hello-world/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
```

#### Deploying Edge Functions

```bash
supabase functions deploy hello-world
```

#### Invoking Edge Functions

**From Client:**
```typescript
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'JavaScript' },
})
```

**From Server:**
```typescript
import { createClient } from '@/utils/supabase/server'

const supabase = createClient()
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'Server' },
})
```

#### Edge Functions with Auth

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  )

  // Get authenticated user
  const { data: { user }, error } = await supabaseClient.auth.getUser()

  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // User is authenticated, execute function logic
  return new Response(
    JSON.stringify({ message: `Hello ${user.email}` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### Realtime

**Official Docs**: https://supabase.com/docs/guides/realtime

#### Enabling Realtime

Realtime is disabled by default. Enable it in your Supabase Dashboard:
1. Go to Database → Replication
2. Enable replication for your tables

#### Three Realtime Features

1. **Broadcast** - Send ephemeral messages between clients
2. **Presence** - Track and synchronize shared state
3. **Postgres Changes** - Listen to database changes

#### Database Changes

```typescript
const supabase = createClient()

const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

#### Broadcast Messages

```typescript
const channel = supabase.channel('room-1')

// Subscribe to broadcast messages
channel
  .on('broadcast', { event: 'cursor-pos' }, (payload) => {
    console.log('Cursor position received!', payload)
  })
  .subscribe()

// Send broadcast message
channel.send({
  type: 'broadcast',
  event: 'cursor-pos',
  payload: { x: 100, y: 200 }
})
```

#### Presence Tracking

```typescript
const channel = supabase.channel('room-1')

// Subscribe and track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('New users joined:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('Users left:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user: 'user-1',
        online_at: new Date().toISOString(),
      })
    }
  })
```

### Cron Jobs

**Official Docs**: https://supabase.com/docs/guides/cron

#### Setting Up Cron

Supabase uses the `pg_cron` extension to schedule recurring jobs.

**Enable pg_cron:**
1. Go to Database → Extensions
2. Enable pg_cron

#### Schedule Edge Function Invocation

```sql
-- Enable pg_net extension
create extension if not exists pg_net;

-- Schedule Edge Function to run every 30 seconds
select cron.schedule(
  'invoke-function-every-half-minute',
  '30 seconds',
  $$
    select net.http_post(
      url:='https://your-project.supabase.co/functions/v1/function-name',
      headers:=jsonb_build_object(
        'Content-Type','application/json',
        'Authorization', 'Bearer ' || 'YOUR_ANON_KEY'
      ),
      body:=jsonb_build_object('time', now()),
      timeout_milliseconds:=5000
    ) as request_id;
  $$
);
```

#### Cron Schedule Examples

```sql
-- Every minute
'* * * * *'

-- Every hour
'0 * * * *'

-- Every day at 3am
'0 3 * * *'

-- Every Monday at 9am
'0 9 * * 1'

-- First day of every month
'0 0 1 * *'
```

#### Managing Cron Jobs

```sql
-- List all cron jobs
select * from cron.job;

-- Delete a cron job
select cron.unschedule('job-name');

-- Update a cron job
select cron.alter_job(
  job_id => 123,
  schedule => '0 * * * *'
);
```

### Storage

#### Upload File

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('public/avatar1.png', file)
```

#### Download File

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .download('public/avatar1.png')
```

#### Get Public URL

```typescript
const { data } = supabase
  .storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')

console.log(data.publicUrl)
```

#### Create Signed URL (Temporary)

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .createSignedUrl('private/avatar1.png', 60) // expires in 60 seconds
```

---

## Clerk (Authentication)

### Official Documentation
- **Main Docs**: https://clerk.com/docs
- **Next.js SDK**: https://clerk.com/docs/nextjs/getting-started/quickstart
- **Supabase Integration**: https://clerk.com/docs/guides/development/integrations/databases/supabase
- **Components Reference**: https://clerk.com/docs/nextjs/reference/components/overview

### What is Clerk?

Clerk is a complete user management platform that provides:
- **Authentication** - Sign-up, sign-in, SSO, social logins (Google, GitHub), MFA
- **User Management** - Profiles, sessions, user metadata
- **Prebuilt Components** - Drop-in UI for auth flows
- **Billing Integration** - Subscription management support

### Installation

```bash
npm install @clerk/nextjs
```

### Environment Variables

```env
# Clerk Keys (from dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs (optional, for custom routes)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/library
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/library
```

### Basic Setup

#### 1. Add Clerk Middleware

**Important:** In Next.js 16, `middleware.ts` is deprecated. Use `proxy.ts` for Next.js 16, or `middleware.ts` for Next.js 15 and earlier.

```typescript
// proxy.ts (Next.js 16) or middleware.ts (Next.js 15)
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

#### 2. Add ClerkProvider to Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Podcast Chat',
  description: 'AI-powered podcast chat application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="flex justify-end items-center p-4 gap-4">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
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

### Protecting Routes

#### Protect Routes in Middleware

```typescript
// proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/library(.*)',
  '/podcasts(.*)',
  '/chat(.*)',
  '/api/chat(.*)',
  '/api/podcasts(.*)',
  '/api/episodes(.*)',
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

#### Protect Content with `<Protect>` Component

```typescript
import { Protect } from '@clerk/nextjs'

export default function LibraryPage() {
  return (
    <div>
      <h1>Your Podcast Library</h1>

      {/* Only authenticated users */}
      <Protect fallback={<p>Please sign in to view your library.</p>}>
        <PodcastLibrary />
      </Protect>
    </div>
  )
}
```

### Server-Side Authentication

#### In Server Components

```typescript
// app/library/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function LibraryPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const supabase = await createClient()

  // Fetch user's podcast library
  const { data: userPodcasts } = await supabase
    .from('user_podcasts')
    .select(`
      *,
      podcast:podcasts(*)
    `)
    .order('added_at', { ascending: false })

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Your Podcast Library</p>
      {/* Render podcasts */}
    </div>
  )
}
```

#### In API Routes

```typescript
// app/api/library/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch user's podcasts from library
  const { data: podcasts, error } = await supabase
    .from('user_podcasts')
    .select(`
      added_at,
      podcast:podcasts(*)
    `)
    .order('added_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ podcasts })
}
```

#### In Server Actions

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function addPodcastToLibrary(podcastId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  // Add podcast to user's library
  const { error } = await supabase
    .from('user_podcasts')
    .insert({
      user_id: userId,
      podcast_id: podcastId,
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/library')
}
```

### Clerk + Supabase Integration

Clerk can be used as a third-party authentication provider with Supabase, allowing you to use Clerk for auth while leveraging Supabase's database, RLS policies, and other features.

#### 1. Configure Clerk for Supabase

1. In the [Clerk Dashboard](https://dashboard.clerk.com), navigate to **Supabase integration setup**
2. Select **Activate Supabase integration**
3. Copy the **Clerk domain** shown

#### 2. Configure Supabase for Clerk

1. In the [Supabase Dashboard](https://supabase.com/dashboard), go to **Authentication > Sign In / Up**
2. Select **Add provider** > **Clerk**
3. Paste the **Clerk domain** from step 1

#### 3. Configure Local Development

Add to your `supabase/config.toml`:

```toml
[auth.third_party.clerk]
enabled = true
domain = "your-clerk-domain.clerk.accounts.dev"
```

#### 4. Create Supabase Client with Clerk Token

```typescript
// lib/supabase/client.ts
'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

export function useSupabaseClient() {
  const { session } = useSession()

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          return session?.getToken() ?? null
        },
      }
    )
  }, [session])

  return supabase
}
```

#### 5. Server-Side Supabase Client with Clerk

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function createServerSupabaseClient() {
  const { getToken } = await auth()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        return await getToken() ?? null
      },
    }
  )
}
```

#### 6. RLS Policies with Clerk JWT Claims

Clerk session tokens include claims you can use in RLS policies:

```sql
-- Get user ID from Clerk JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE SQL STABLE;

-- Enable RLS on user-specific tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_synced_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR ALL USING (clerk_user_id = auth.user_id());

-- Users can manage their own podcast library
CREATE POLICY "Users can manage own podcasts" ON user_podcasts
  FOR ALL USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.user_id()
  ));

-- Users can manage their own synced episodes
CREATE POLICY "Users can manage own synced episodes" ON user_synced_episodes
  FOR ALL USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.user_id()
  ));

-- Users can manage their own chat sessions
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions
  FOR ALL USING (user_id IN (
    SELECT id FROM user_profiles WHERE clerk_user_id = auth.user_id()
  ));

-- Users can view their own chat messages
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR ALL USING (session_id IN (
    SELECT id FROM chat_sessions WHERE user_id IN (
      SELECT id FROM user_profiles WHERE clerk_user_id = auth.user_id()
    )
  ));

-- Podcasts and episodes are publicly readable (shared resources)
-- Only system can write to these tables
```

#### 7. Example: User's Podcast Library Query

```typescript
'use client'

import { useSupabaseClient } from '@/lib/supabase/client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

interface UserPodcast {
  id: string
  added_at: string
  podcast: {
    id: string
    name: string
    author: string
    image_url: string
    total_episodes: number
  }
}

export function PodcastLibrary() {
  const supabase = useSupabaseClient()
  const { user } = useUser()
  const [podcasts, setPodcasts] = useState<UserPodcast[]>([])

  useEffect(() => {
    async function fetchLibrary() {
      // RLS policies automatically filter by user
      const { data, error } = await supabase
        .from('user_podcasts')
        .select(`
          id,
          added_at,
          podcast:podcasts(id, name, author, image_url, total_episodes)
        `)
        .order('added_at', { ascending: false })

      if (!error && data) {
        setPodcasts(data)
      }
    }

    if (user) {
      fetchLibrary()
    }
  }, [supabase, user])

  return (
    <div>
      <h2>Your Podcast Library</h2>
      <ul>
        {podcasts.map((item) => (
          <li key={item.id}>
            <img src={item.podcast.image_url} alt={item.podcast.name} />
            <h3>{item.podcast.name}</h3>
            <p>By {item.podcast.author}</p>
            <p>{item.podcast.total_episodes} episodes</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Database Schema (Matching PRD)

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

-- Enable RLS on user-specific tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_synced_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
```

### Prebuilt Components Reference

| Component | Description |
|-----------|-------------|
| `<SignIn />` | Full sign-in form |
| `<SignUp />` | Full sign-up form |
| `<SignInButton />` | Button that opens sign-in |
| `<SignUpButton />` | Button that opens sign-up |
| `<SignOutButton />` | Button to sign out |
| `<UserButton />` | User avatar with dropdown menu |
| `<UserProfile />` | Full user profile management |
| `<Protect />` | Conditionally render based on auth |
| `<SignedIn />` | Show content when signed in |
| `<SignedOut />` | Show content when signed out |

### Hooks Reference

| Hook | Description |
|------|-------------|
| `useUser()` | Get current user object |
| `useAuth()` | Get auth state and helpers |
| `useSession()` | Get current session (includes getToken for Supabase) |
| `useSignIn()` | Programmatic sign-in control |
| `useSignUp()` | Programmatic sign-up control |

### Server Functions Reference

| Function | Description |
|----------|-------------|
| `auth()` | Get auth state in server context (userId, getToken) |
| `currentUser()` | Get full user object |
| `clerkClient` | Access Clerk Backend API |

---

## Taddy API (Podcast Data)

### Official Documentation
- **Main Docs**: https://taddy.org/developers
- **Intro to API**: https://taddy.org/developers/intro-to-taddy-graphql-api
- **Podcast API**: https://taddy.org/developers/podcast-api
- **PodcastSeries Type**: https://taddy.org/developers/podcast-api/podcastseries
- **PodcastEpisode Type**: https://taddy.org/developers/podcast-api/podcastepisode
- **Example Project**: https://github.com/taddyorg/taddy-api-example-project

### What is Taddy?

Taddy provides a GraphQL API for podcast data with:
- **4M+ Podcasts** - Comprehensive podcast database
- **180M+ Episodes** - Full episode metadata and audio URLs
- **Episode Transcripts** - Pre-generated transcripts for many episodes
- **Full-Text Search** - Fast search across all podcasts and episodes
- **Webhook Notifications** - Real-time updates for new episodes

### API Endpoint & Authentication

**Endpoint:** `POST https://api.taddy.org`

**Required Headers:**
```typescript
{
  "Content-Type": "application/json",
  "X-USER-ID": "your-user-id",
  "X-API-KEY": "your-api-key"
}
```

Get your credentials from the [Taddy Dashboard](https://taddy.org/developers) after signing up.

### Environment Variables

```env
TADDY_USER_ID=your-user-id
TADDY_API_KEY=your-api-key
```

### GraphQL Client Setup

```typescript
// lib/taddy.ts
const TADDY_API_URL = 'https://api.taddy.org'

interface TaddyResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

export async function taddyQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(TADDY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-USER-ID': process.env.TADDY_USER_ID!,
      'X-API-KEY': process.env.TADDY_API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  })

  const result: TaddyResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result.data
}
```

### Core GraphQL Types

#### PodcastSeries

| Field | Type | Description |
|-------|------|-------------|
| `uuid` | ID | Taddy's unique identifier |
| `name` | String | Podcast title |
| `description` | String | Podcast summary |
| `authorName` | String | Creator name |
| `imageUrl` | String | Cover artwork URL |
| `itunesId` | Int | iTunes identifier |
| `rssUrl` | String | RSS feed URL |
| `language` | Language | Primary spoken language |
| `genres` | [Genre] | Up to 5 genres |
| `totalEpisodesCount` | Int | Total episode count |
| `episodes` | [PodcastEpisode] | Paginated episode list |
| `contentType` | PodcastContentType | Audio or video |
| `isExplicitContent` | Boolean | Explicit content flag |

#### PodcastEpisode

| Field | Type | Description |
|-------|------|-------------|
| `uuid` | ID | Unique identifier |
| `name` | String | Episode title |
| `description` | String | Episode description |
| `audioUrl` | String | Audio file URL |
| `imageUrl` | String | Episode artwork |
| `duration` | Int | Length in seconds |
| `datePublished` | Int | Epoch time in seconds |
| `seasonNumber` | Int | Season designation |
| `episodeNumber` | Int | Episode number |
| `guid` | String | RSS feed unique identifier |
| `taddyTranscribeStatus` | String | Transcript status |
| `transcript` | String | Parsed transcript text |
| `transcriptWithSpeakersAndTimecodes` | [TranscriptItem] | Detailed transcript |

### Search Podcasts

```typescript
// Search for podcasts by name
const SEARCH_PODCASTS = `
  query SearchPodcasts($term: String!) {
    searchForTerm(term: $term, filterForTypes: PODCASTSERIES, first: 20) {
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
`

interface SearchResult {
  searchForTerm: {
    searchId: string
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
}

export async function searchPodcasts(term: string) {
  const data = await taddyQuery<SearchResult>(SEARCH_PODCASTS, { term })
  return data.searchForTerm.podcastSeries
}
```

### Get Podcast Details

```typescript
const GET_PODCAST = `
  query GetPodcast($uuid: ID!) {
    getPodcastSeries(uuid: $uuid) {
      uuid
      name
      description
      authorName
      imageUrl
      itunesId
      rssUrl
      language {
        name
      }
      totalEpisodesCount
      genres {
        name
      }
    }
  }
`

export async function getPodcast(uuid: string) {
  const data = await taddyQuery<{ getPodcastSeries: PodcastSeries }>(GET_PODCAST, { uuid })
  return data.getPodcastSeries
}
```

### Get Episodes with Pagination

```typescript
const GET_EPISODES = `
  query GetEpisodes($uuid: ID!, $page: Int!, $limitPerPage: Int!) {
    getPodcastSeries(uuid: $uuid) {
      uuid
      name
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
      }
    }
  }
`

export async function getEpisodes(podcastUuid: string, page: number = 1, limit: number = 25) {
  const data = await taddyQuery<{ getPodcastSeries: { episodes: PodcastEpisode[] } }>(
    GET_EPISODES,
    { uuid: podcastUuid, page, limitPerPage: limit }
  )
  return data.getPodcastSeries.episodes
}
```

### Get Episode Transcript

Taddy provides transcripts for many episodes. Check `taddyTranscribeStatus` first:
- `COMPLETE` - Transcript available
- `PROCESSING` - Being transcribed
- `NOT_TRANSCRIBED` - No transcript (use Deepgram fallback)

```typescript
const GET_EPISODE_TRANSCRIPT = `
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

interface TranscriptItem {
  text: string
  startTime: number
  endTime: number
  speaker: string | null
}

export async function getEpisodeTranscript(uuid: string) {
  const data = await taddyQuery<{
    getPodcastEpisode: {
      uuid: string
      name: string
      taddyTranscribeStatus: string
      transcript: string | null
      transcriptWithSpeakersAndTimecodes: TranscriptItem[] | null
    }
  }>(GET_EPISODE_TRANSCRIPT, { uuid })

  return data.getPodcastEpisode
}
```

### API Route Example

```typescript
// app/api/podcasts/search/route.ts
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

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  try {
    const podcasts = await searchPodcasts(query)
    return NextResponse.json({ podcasts })
  } catch (error) {
    console.error('Taddy API error:', error)
    return NextResponse.json({ error: 'Failed to search podcasts' }, { status: 500 })
  }
}
```

### Sync Episode Flow (Taddy → Deepgram Fallback)

```typescript
// lib/sync.ts
import { getEpisodeTranscript } from '@/lib/taddy'
import { transcribeWithDeepgram } from '@/lib/deepgram'

export async function syncEpisodeTranscript(episode: {
  taddy_uuid: string
  audio_url: string
}) {
  // 1. Try Taddy transcript first
  const taddyResult = await getEpisodeTranscript(episode.taddy_uuid)

  if (taddyResult.taddyTranscribeStatus === 'COMPLETE' && taddyResult.transcript) {
    return {
      source: 'taddy',
      transcript: taddyResult.transcript,
      segments: taddyResult.transcriptWithSpeakersAndTimecodes,
    }
  }

  // 2. Fallback to Deepgram
  const deepgramResult = await transcribeWithDeepgram(episode.audio_url)

  return {
    source: 'deepgram',
    transcript: deepgramResult.transcript,
    segments: deepgramResult.utterances,
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `API_KEY_INVALID` | Authentication credentials failed |
| `API_RATE_LIMIT_EXCEEDED` | Monthly quota exhausted |
| `QUERY_TOO_COMPLEX` | Simplify your query structure |
| `NOT_FOUND` | Podcast or episode not found |

### Check API Quota

```typescript
const CHECK_QUOTA = `
  query {
    getApiRequestsRemaining
  }
`

export async function checkApiQuota() {
  const data = await taddyQuery<{ getApiRequestsRemaining: number }>(CHECK_QUOTA)
  return data.getApiRequestsRemaining
}
```

---

## ShadCN UI

### Official Documentation
- **Main Docs**: https://ui.shadcn.com/docs
- **Installation**: https://ui.shadcn.com/docs/installation/next
- **Theming**: https://ui.shadcn.com/docs/theming
- **Components**: https://ui.shadcn.com/docs/components
- **Theme Builder**: https://ui.shadcn.com/themes

### Installation for Next.js

#### Automatic Setup

```bash
npx shadcn@latest init
```

This will:
1. Detect your Next.js project
2. Ask configuration questions
3. Create `components.json`
4. Set up Tailwind CSS with CSS variables
5. Add necessary dependencies

**Configuration Options:**
```
Which style would you like to use? › New York
Which color would you like to use as base color? › Slate
Do you want to use CSS variables for colors? › yes
```

#### Manual Setup

1. **Install dependencies:**
```bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install lucide-react
```

2. **Configure Tailwind:**
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

3. **Add CSS variables:**
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

4. **Create utils function:**
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Adding Components

```bash
# Add a single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card dialog

# Add all components
npx shadcn@latest add
```

### Usage Example

```typescript
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <Button>Button</Button>
      </CardFooter>
    </Card>
  )
}
```

### Theming

#### Customizing Colors

Visit https://ui.shadcn.com/themes to:
1. Choose a base color
2. Set border radius
3. Select light/dark mode
4. Copy the generated CSS variables

#### Dark Mode

**1. Install next-themes:**
```bash
npm install next-themes
```

**2. Create theme provider:**
```typescript
// components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**3. Wrap your app:**
```typescript
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**4. Create theme toggle:**
```typescript
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Popular Components

**Button Variants:**
```typescript
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <ChevronRight className="h-4 w-4" />
</Button>
```

**Dialog:**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

---

## AI Elements Registry

### Official Documentation
- **AI SDK Docs**: https://ai-sdk.dev/docs
- **AI SDK UI**: https://ai-sdk.dev/docs/ai-sdk-ui
- **useChat Hook**: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- **Chatbot Guide**: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot

### Installation

**Prerequisites:**
- Node.js 20.9+
- Next.js 16 with AI SDK
- shadcn/ui initialized
- Tailwind CSS with CSS Variables mode

#### Install AI SDK and Components

```bash
# Install AI SDK core packages
npm install ai @ai-sdk/openai @ai-sdk/react

# Install chat components via shadcn registry
npx shadcn@latest add https://ai-sdk.dev/registry/chat.json

# Install a specific component
npx shadcn@latest add https://registry.ai-sdk.dev/message.json
npx shadcn@latest add https://registry.ai-sdk.dev/conversation.json
```

Or using the AI Elements CLI:
```bash
npx ai-elements@latest add message
npx ai-elements@latest add conversation
```

### Available Components

#### Chatbot Components (31+ components)

**Core:**
- `message` - Display AI and user messages
- `conversation` - Container for message threads
- `prompt-input` - Input field for user prompts

**Interactions:**
- `actions` - Action buttons for messages
- `branch` - Message branching interface
- `suggestion` - Quick prompt suggestions

**Content Display:**
- `code-block` - Syntax-highlighted code
- `image` - Image display with zoom
- `inline-citation` - Inline source citations
- `sources` - Source attribution display

**Advanced:**
- `chain-of-thought` - Show reasoning steps
- `reasoning` - Display model reasoning
- `plan` - Show AI planning steps
- `task` - Task execution display
- `tool` - Tool call visualization
- `context` - Context display
- `confirmation` - User confirmation prompts

**UI Helpers:**
- `loader` - Loading indicators
- `shimmer` - Skeleton loading
- `queue` - Message queue display
- `response` - Response wrapper
- `open-in-chat` - Link to open in chat

#### Vibe-Coding Components
- `artifact` - Code artifact display
- `web-preview` - Live web preview

#### Workflow Components
- `canvas` - Workflow canvas
- `node` - Workflow nodes
- `edge` - Workflow connections
- `connection` - Connection management
- `controls` - Workflow controls
- `panel` - Workflow panel
- `toolbar` - Workflow toolbar

### Chat Component Integration

#### Basic Setup

```typescript
'use client'

import { useChat } from '@ai-sdk/react'
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { PromptInput } from '@/components/ai-elements/prompt-input'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  })

  return (
    <div className="flex flex-col h-screen">
      <Conversation>
        <ConversationContent>
          {messages.map(message => (
            <Message key={message.id} role={message.role}>
              <MessageContent>
                {message.content}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      <PromptInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        placeholder="Ask me anything..."
        disabled={isLoading}
      />
    </div>
  )
}
```

#### Advanced Chat with Code Blocks

```typescript
'use client'

import { useChat } from '@ai-sdk/react'
import { Conversation } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { CodeBlock } from '@/components/ai-elements/code-block'
import { PromptInput } from '@/components/ai-elements/prompt-input'
import { Loader } from '@/components/ai-elements/loader'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  return (
    <div className="flex flex-col h-screen">
      <Conversation>
        {messages.map(message => (
          <Message key={message.id} role={message.role}>
            <MessageContent>
              {message.content}
            </MessageContent>

            {message.toolInvocations?.map((tool) => (
              <CodeBlock
                key={tool.toolCallId}
                language="typescript"
                code={JSON.stringify(tool.result, null, 2)}
              />
            ))}
          </Message>
        ))}

        {isLoading && (
          <Message role="assistant">
            <Loader />
          </Message>
        )}
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

#### Chat with Suggestions

```typescript
import { Suggestion } from '@/components/ai-elements/suggestion'

const suggestions = [
  "Explain quantum computing",
  "Write a React component",
  "Help me debug this code"
]

<div>
  {suggestions.map((text) => (
    <Suggestion
      key={text}
      onClick={() => {
        handleInputChange({ target: { value: text } })
        handleSubmit()
      }}
    >
      {text}
    </Suggestion>
  ))}
</div>
```

#### Chat with Tool Visualization

```typescript
import { Tool } from '@/components/ai-elements/tool'

<Message role="assistant">
  {message.toolInvocations?.map((tool) => (
    <Tool
      key={tool.toolCallId}
      name={tool.toolName}
      status={tool.state}
      result={tool.result}
    />
  ))}
</Message>
```

### Customization

All AI Elements components are copied to your project (typically in `@/components/ai-elements/`), allowing full customization:

```typescript
// Customize the Message component
export function Message({ role, children }: MessageProps) {
  return (
    <div className={cn(
      "flex gap-3 p-4",
      role === "user" && "bg-blue-50 dark:bg-blue-950",
      role === "assistant" && "bg-gray-50 dark:bg-gray-950"
    )}>
      {children}
    </div>
  )
}
```

---

## Vercel AI SDK

### Official Documentation
- **Main Docs**: https://ai-sdk.dev/docs/introduction
- **Getting Started**: https://ai-sdk.dev/docs/getting-started
- **AI SDK Core**: https://ai-sdk.dev/docs/ai-sdk-core
- **AI SDK UI**: https://ai-sdk.dev/docs/ai-sdk-ui
- **Tool Calling**: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- **RAG Guide**: https://ai-sdk.dev/cookbook/guides/rag-chatbot
- **Templates**: https://vercel.com/templates/next.js/ai-sdk-rag

### Installation

```bash
npm install ai @ai-sdk/openai zod
```

For other providers:
```bash
npm install @ai-sdk/anthropic
npm install @ai-sdk/google
npm install @ai-sdk/mistral
```

### Basic Setup

#### API Route

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// Next.js 16: 'nodejs' is default, edge runtime optional
// export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

#### Client Component

```typescript
'use client'

import { useChat } from '@ai-sdk/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
        />
      </form>
    </div>
  )
}
```

### Streaming

**Official Docs**: https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data

#### Text Streaming

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

const result = streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'Write a short story about a robot.',
})

// Stream to client
return result.toDataStreamResponse()
```

#### Object Streaming

```typescript
import { openai } from '@ai-sdk/openai'
import { streamObject } from 'ai'
import { z } from 'zod'

const result = streamObject({
  model: openai('gpt-4-turbo'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a cookie recipe.',
})

return result.toTextStreamResponse()
```

#### Custom Data Streaming

```typescript
import { StreamData } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const data = new StreamData()

  data.append({ timestamp: Date.now() })

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    onFinish() {
      data.append({ finishedAt: Date.now() })
      data.close()
    },
  })

  return result.toDataStreamResponse({ data })
}
```

**Client-side:**
```typescript
const { messages, data } = useChat()

console.log(data) // Access custom streamed data
```

### Tool Calling

**Official Docs**: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling

#### Basic Tool Definition

```typescript
import { openai } from '@ai-sdk/openai'
import { generateText, tool } from 'ai'
import { z } from 'zod'

const result = await generateText({
  model: openai('gpt-4-turbo'),
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  toolChoice: 'required',
  prompt: 'What is the weather in San Francisco?',
})
```

#### Multi-Step Tool Calling

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: {
      getWeather: tool({
        description: 'Get the weather for a location',
        parameters: z.object({
          location: z.string(),
        }),
        execute: async ({ location }) => {
          // Call weather API
          return { temperature: 72, condition: 'sunny' }
        },
      }),
      searchDatabase: tool({
        description: 'Search the database',
        parameters: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => {
          // Search database
          return { results: [] }
        },
      }),
    },
    stopWhen: (step) => {
      // Continue calling tools until no more tool calls
      return step.finishReason === 'stop'
    },
  })

  return result.toDataStreamResponse()
}
```

#### Tool Calling with UI

```typescript
'use client'

import { useChat } from '@ai-sdk/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 5, // Enable multi-step tool calling
  })

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>{message.role}: {message.content}</div>

          {message.toolInvocations?.map(tool => (
            <div key={tool.toolCallId}>
              {tool.toolName}
              {tool.state === 'result' && (
                <pre>{JSON.stringify(tool.result, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  )
}
```

### RAG Patterns

**Official Docs**: https://ai-sdk.dev/cookbook/guides/rag-chatbot

#### RAG with Tool Calling

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: {
      searchKnowledgeBase: tool({
        description: 'Search the knowledge base for relevant information',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          // 1. Generate embedding for query
          const embedding = await generateEmbedding(query)

          // 2. Search vector database (e.g., Chroma)
          const results = await chromaClient.query({
            collectionName: 'knowledge-base',
            queryEmbeddings: [embedding],
            nResults: 5,
          })

          // 3. Return relevant documents
          return {
            documents: results.documents[0],
            metadata: results.metadatas[0],
          }
        },
      }),
    },
    stopWhen: (step) => step.finishReason === 'stop',
  })

  return result.toDataStreamResponse()
}
```

#### RAG with Middleware

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the last user message
  const lastMessage = messages[messages.length - 1]

  // Retrieve relevant context
  const embedding = await generateEmbedding(lastMessage.content)
  const relevantDocs = await searchVectorDB(embedding)

  // Add context to system message
  const systemMessage = {
    role: 'system',
    content: `You are a helpful assistant. Use the following context to answer questions:

${relevantDocs.map(doc => doc.content).join('\n\n')}`,
  }

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages: [systemMessage, ...messages],
  })

  return result.toDataStreamResponse()
}
```

#### Complete RAG Example with Embeddings

```typescript
import { openai } from '@ai-sdk/openai'
import { embed, streamText } from 'ai'

// Generate embeddings
async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  })
  return embedding
}

// Store documents with embeddings
async function storeDocument(text: string, metadata: any) {
  const embedding = await generateEmbedding(text)

  await chromaClient.collection('docs').add({
    ids: [metadata.id],
    embeddings: [embedding],
    documents: [text],
    metadatas: [metadata],
  })
}

// RAG chat endpoint
export async function POST(req: Request) {
  const { messages } = await req.json()

  const lastMessage = messages[messages.length - 1].content

  // 1. Generate embedding for query
  const queryEmbedding = await generateEmbedding(lastMessage)

  // 2. Search vector database
  const results = await chromaClient.collection('docs').query({
    queryEmbeddings: [queryEmbedding],
    nResults: 3,
  })

  // 3. Build context from results
  const context = results.documents[0].join('\n\n')

  // 4. Stream response with context
  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: `Use this context to answer: ${context}`,
    messages,
  })

  return result.toDataStreamResponse()
}
```

### Advanced Features

#### Dynamic Tools

```typescript
import { dynamicTool } from 'ai'

const tools = {
  executeQuery: dynamicTool({
    description: 'Execute a database query',
    parameters: async () => {
      // Load schema at runtime
      const schema = await loadDatabaseSchema()
      return z.object({
        query: z.string(),
        table: z.enum(schema.tables),
      })
    },
    execute: async ({ query, table }) => {
      // Execute query
    },
  }),
}
```

#### Model Context Protocol (MCP) Integration

```typescript
import { createMcpClient } from '@ai-sdk/mcp'
import { streamText } from 'ai'

const mcpClient = createMcpClient({
  servers: {
    memory: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
})

const tools = await mcpClient.tools()

const result = streamText({
  model: openai('gpt-4-turbo'),
  tools,
  messages,
})
```

---

## Trigger.dev

### Official Documentation
- **Main Docs**: https://trigger.dev/docs
- **Getting Started**: https://trigger.dev/docs/quick-start
- **Next.js Guide**: https://trigger.dev/docs/guides/frameworks/nextjs
- **API Reference**: https://trigger.dev/docs/sdk
- **Examples**: https://trigger.dev/docs/guides/examples
- **Deepgram Integration**: https://trigger.dev/docs/guides/examples/deepgram-transcription

### What is Trigger.dev?

Trigger.dev is a background jobs framework for TypeScript that provides:
- **Durable execution** - Jobs survive server restarts and failures
- **Automatic retries** - Configurable retry strategies with exponential backoff
- **Real-time monitoring** - Dashboard for job status and logs
- **React hooks** - `useRealtimeRun` for live status updates
- **Type safety** - Full TypeScript support with typed payloads

### Installation

```bash
# Install the SDK
npm install @trigger.dev/sdk

# Initialize in your project
npx trigger.dev@latest init
```

This creates:
- `trigger.config.ts` - Configuration file
- `trigger/` directory - For your task files

### Configuration

```typescript
// trigger.config.ts
import { defineConfig } from '@trigger.dev/sdk/v3'

export default defineConfig({
  project: 'your-project-ref', // From Trigger.dev dashboard
  runtime: 'node',
  logLevel: 'log',
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2, // Exponential backoff factor
    },
  },
  dirs: ['trigger'], // Directory containing task files
})
```

### Creating Tasks

#### Basic Task

```typescript
// trigger/tasks/hello.ts
import { task } from '@trigger.dev/sdk/v3'

export const helloWorld = task({
  id: 'hello-world',
  run: async (payload: { name: string }) => {
    console.log(`Hello, ${payload.name}!`)
    return { message: `Hello, ${payload.name}!` }
  },
})
```

#### Task with Retry Configuration

```typescript
// trigger/tasks/transcribe.ts
import { task } from '@trigger.dev/sdk/v3'
import { createClient } from '@deepgram/sdk'

export const transcribeAudio = task({
  id: 'transcribe-audio',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: { audioUrl: string; podcastId: string }) => {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: payload.audioUrl },
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

    const transcript = result.results.channels[0].alternatives[0].transcript

    return {
      success: true,
      podcastId: payload.podcastId,
      transcript,
      metadata: result.metadata,
    }
  },
})
```

### Triggering Tasks

#### From API Routes

```typescript
// app/api/transcribe/route.ts
import { transcribeAudio } from '@/trigger/tasks/transcribe'

export async function POST(req: Request) {
  const { audioUrl, podcastId } = await req.json()

  // Trigger returns immediately with a handle
  const handle = await transcribeAudio.trigger({
    audioUrl,
    podcastId,
  })

  return Response.json({
    runId: handle.id,
    status: 'started',
  })
}
```

#### From Server Actions

```typescript
'use server'

import { transcribeAudio } from '@/trigger/tasks/transcribe'
import { revalidatePath } from 'next/cache'

export async function startTranscription(audioUrl: string, podcastId: string) {
  const handle = await transcribeAudio.trigger({
    audioUrl,
    podcastId,
  })

  revalidatePath('/podcasts')

  return { runId: handle.id }
}
```

#### Trigger and Wait (Synchronous)

```typescript
// Wait for the task to complete
const result = await transcribeAudio.triggerAndWait({
  audioUrl,
  podcastId,
})

if (result.ok) {
  console.log('Transcript:', result.output.transcript)
} else {
  console.error('Failed:', result.error)
}
```

### Real-Time Status with React Hooks

```typescript
'use client'

import { useRealtimeRun } from '@trigger.dev/react-hooks'

interface TranscriptionStatusProps {
  runId: string
}

export function TranscriptionStatus({ runId }: TranscriptionStatusProps) {
  const { run, error } = useRealtimeRun(runId)

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>
  }

  if (!run) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span>Status:</span>
        <span className={`font-medium ${
          run.status === 'COMPLETED' ? 'text-green-500' :
          run.status === 'FAILED' ? 'text-red-500' :
          'text-yellow-500'
        }`}>
          {run.status}
        </span>
      </div>

      {run.status === 'COMPLETED' && run.output && (
        <div>
          <p>Transcription complete!</p>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(run.output, null, 2)}
          </pre>
        </div>
      )}

      {run.status === 'FAILED' && (
        <p className="text-red-500">
          Error: {run.error?.message || 'Unknown error'}
        </p>
      )}
    </div>
  )
}
```

### Advanced Patterns

#### Batch Processing

```typescript
import { task, batch } from '@trigger.dev/sdk/v3'

export const batchTranscribe = task({
  id: 'batch-transcribe-episodes',
  run: async (payload: { episodes: Array<{ url: string; id: string }> }) => {
    // Trigger multiple tasks in parallel
    const results = await batch.triggerAndWait(
      payload.episodes.map((episode) =>
        transcribeAudio.trigger({
          audioUrl: episode.url,
          podcastId: episode.id,
        })
      )
    )

    const completed = results.filter(r => r.ok)
    const failed = results.filter(r => !r.ok)

    return {
      total: results.length,
      completed: completed.length,
      failed: failed.length,
      errors: failed.map(f => f.error),
    }
  },
})
```

#### Scheduled Tasks (Cron)

```typescript
import { schedules } from '@trigger.dev/sdk/v3'

export const syncPodcastFeeds = schedules.task({
  id: 'sync-podcast-feeds',
  cron: '0 * * * *', // Every hour
  run: async () => {
    const supabase = await createClient()

    const { data: podcasts } = await supabase
      .from('podcasts')
      .select('id, feed_url')
      .eq('active', true)

    let synced = 0

    for (const podcast of podcasts || []) {
      try {
        await syncSingleFeed.trigger({
          podcastId: podcast.id,
          feedUrl: podcast.feed_url,
        })
        synced++
      } catch (error) {
        console.error(`Failed to sync ${podcast.id}:`, error)
      }
    }

    return { synced, total: podcasts?.length || 0 }
  },
})

// Daily cleanup job
export const cleanupOldRuns = schedules.task({
  id: 'cleanup-old-runs',
  cron: '0 3 * * *', // Daily at 3 AM
  run: async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const supabase = await createClient()

    const { count } = await supabase
      .from('job_runs')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())

    return { deleted: count }
  },
})
```

#### Error Handling with catchError

```typescript
import { task } from '@trigger.dev/sdk/v3'

export const transcribeWithErrorHandling = task({
  id: 'transcribe-with-error-handling',
  retry: {
    maxAttempts: 3,
  },
  catchError: async (payload, error, { ctx }) => {
    console.error(`Task ${ctx.run.id} failed:`, error)

    // Update database with failure status
    const supabase = await createClient()
    await supabase
      .from('episodes')
      .update({
        transcription_status: 'failed',
        transcription_error: error.message,
      })
      .eq('id', payload.podcastId)

    // Optionally notify via webhook or email
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Transcription failed for podcast ${payload.podcastId}: ${error.message}`,
      }),
    })

    // Return fallback result
    return {
      success: false,
      error: error.message,
      podcastId: payload.podcastId,
    }
  },
  run: async (payload: { audioUrl: string; podcastId: string }) => {
    // Update status to processing
    const supabase = await createClient()
    await supabase
      .from('episodes')
      .update({ transcription_status: 'processing' })
      .eq('id', payload.podcastId)

    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: payload.audioUrl },
      { model: 'nova-2', smart_format: true }
    )

    if (error) throw error

    // Update with completed transcript
    await supabase
      .from('episodes')
      .update({
        transcription_status: 'completed',
        transcript: result.results.channels[0].alternatives[0].transcript,
      })
      .eq('id', payload.podcastId)

    return { success: true, podcastId: payload.podcastId }
  },
})
```

#### Subtasks and Task Chaining

```typescript
import { task } from '@trigger.dev/sdk/v3'

// Step 1: Transcribe
export const transcribeStep = task({
  id: 'pipeline-transcribe',
  run: async (payload: { audioUrl: string }) => {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)
    const { result } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: payload.audioUrl },
      { model: 'nova-2', smart_format: true }
    )
    return { transcript: result.results.channels[0].alternatives[0].transcript }
  },
})

// Step 2: Generate embeddings
export const embedStep = task({
  id: 'pipeline-embed',
  run: async (payload: { transcript: string }) => {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: payload.transcript,
    })
    return { embedding }
  },
})

// Step 3: Store in vector DB
export const storeStep = task({
  id: 'pipeline-store',
  run: async (payload: { transcript: string; embedding: number[]; podcastId: string }) => {
    const collection = await chromaClient.getCollection({ name: 'podcasts' })
    await collection.add({
      ids: [payload.podcastId],
      embeddings: [payload.embedding],
      documents: [payload.transcript],
    })
    return { stored: true }
  },
})

// Orchestrator task
export const processPodcast = task({
  id: 'process-podcast-pipeline',
  run: async (payload: { audioUrl: string; podcastId: string }) => {
    // Step 1
    const transcribeResult = await transcribeStep.triggerAndWait({
      audioUrl: payload.audioUrl,
    })
    if (!transcribeResult.ok) throw new Error('Transcription failed')

    // Step 2
    const embedResult = await embedStep.triggerAndWait({
      transcript: transcribeResult.output.transcript,
    })
    if (!embedResult.ok) throw new Error('Embedding failed')

    // Step 3
    const storeResult = await storeStep.triggerAndWait({
      transcript: transcribeResult.output.transcript,
      embedding: embedResult.output.embedding,
      podcastId: payload.podcastId,
    })
    if (!storeResult.ok) throw new Error('Storage failed')

    return { success: true, podcastId: payload.podcastId }
  },
})
```

### Development & Deployment

#### Local Development

```bash
# Start the Trigger.dev dev server
npx trigger.dev@latest dev

# This connects to Trigger.dev cloud and forwards tasks locally
```

#### Deployment

```bash
# Deploy tasks to Trigger.dev cloud
npx trigger.dev@latest deploy
```

### Environment Variables

```env
# Required
TRIGGER_SECRET_KEY=tr_dev_xxx  # From Trigger.dev dashboard

# For Deepgram integration
DEEPGRAM_API_KEY=xxx
```

### Pricing

| Tier | Monthly Cost | Included Usage | Concurrent Runs |
|------|--------------|----------------|-----------------|
| Free | $0 | $5/mo compute | 10 |
| Hobby | $10 | $15/mo compute | 25 |
| Pro | $50 | $100/mo compute | 100 |

**Compute pricing:** ~$0.00012/second for standard tasks

---

## Chroma Cloud

### Official Documentation
- **Main Docs**: https://docs.trychroma.com/
- **Getting Started**: https://docs.trychroma.com/getting-started
- **JavaScript Client**: https://docs.trychroma.com/js
- **Cloud**: https://www.trychroma.com/cloud
- **GitHub**: https://github.com/chroma-core/chroma

### Installation

```bash
# Using npm
npm install chromadb @chroma-core/default-embed

# Using pnpm
pnpm add chromadb @chroma-core/default-embed

# Using yarn
yarn add chromadb @chroma-core/default-embed

# Using bun
bun add chromadb @chroma-core/default-embed
```

### Setup

#### Local Development

```typescript
import { ChromaClient } from 'chromadb'

const client = new ChromaClient()
```

#### Chroma Cloud

```typescript
import { ChromaClient } from 'chromadb'

const client = new ChromaClient({
  path: process.env.CHROMA_CLOUD_URL,
  auth: {
    provider: 'token',
    credentials: process.env.CHROMA_API_KEY,
  },
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
})
```

**Environment Variables:**
```env
CHROMA_CLOUD_URL=https://api.trychroma.com
CHROMA_API_KEY=your-api-key
CHROMA_TENANT=your-tenant
CHROMA_DATABASE=your-database
```

### Collection Management

#### Create Collection

```typescript
const collection = await client.createCollection({
  name: 'my-collection',
  metadata: { description: 'My first collection' },
})
```

#### Get or Create Collection

```typescript
const collection = await client.getOrCreateCollection({
  name: 'my-collection',
})
```

#### Get Collection

```typescript
const collection = await client.getCollection({
  name: 'my-collection',
})
```

#### List Collections

```typescript
const collections = await client.listCollections()
```

#### Delete Collection

```typescript
await client.deleteCollection({ name: 'my-collection' })
```

### Adding Data

#### Add Single Document

```typescript
await collection.add({
  ids: ['id1'],
  documents: ['This is a document'],
  metadatas: [{ source: 'web', date: '2024-01-01' }],
})
```

#### Add Multiple Documents

```typescript
await collection.add({
  ids: ['id1', 'id2', 'id3'],
  documents: [
    'First document',
    'Second document',
    'Third document',
  ],
  metadatas: [
    { category: 'tech' },
    { category: 'science' },
    { category: 'tech' },
  ],
})
```

#### Add with Custom Embeddings

```typescript
await collection.add({
  ids: ['id1', 'id2'],
  embeddings: [
    [1.1, 2.3, 3.2],
    [4.5, 6.9, 4.4],
  ],
  documents: ['Document 1', 'Document 2'],
  metadatas: [{ source: 'doc1' }, { source: 'doc2' }],
})
```

### Embedding Functions

#### Using OpenAI Embeddings

```typescript
import { OpenAIEmbeddingFunction } from 'chromadb'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
  model_name: 'text-embedding-3-small',
})

const collection = await client.createCollection({
  name: 'my-collection',
  embeddingFunction: embedder,
})

// Documents will be automatically embedded
await collection.add({
  ids: ['id1'],
  documents: ['This will be automatically embedded'],
})
```

#### Using Default Embeddings

```typescript
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed'

const embedder = new DefaultEmbeddingFunction()

const collection = await client.createCollection({
  name: 'my-collection',
  embeddingFunction: embedder,
})
```

### Querying

#### Query by Text

```typescript
const results = await collection.query({
  queryTexts: ['What is machine learning?'],
  nResults: 5,
})

console.log(results.documents[0]) // Top 5 matching documents
console.log(results.distances[0]) // Similarity scores
console.log(results.metadatas[0]) // Metadata for matches
```

#### Query by Embedding

```typescript
const results = await collection.query({
  queryEmbeddings: [[1.1, 2.3, 3.2]],
  nResults: 5,
})
```

#### Query with Metadata Filter

```typescript
const results = await collection.query({
  queryTexts: ['machine learning'],
  nResults: 10,
  where: {
    category: 'tech',
    date: { $gte: '2024-01-01' },
  },
})
```

#### Query with Document Filter

```typescript
const results = await collection.query({
  queryTexts: ['python programming'],
  nResults: 5,
  whereDocument: {
    $contains: 'python',
  },
})
```

### Metadata Filtering

Chroma supports MongoDB-style operators:

```typescript
// Equality
where: { category: 'tech' }

// Greater than
where: { year: { $gt: 2020 } }

// Greater than or equal
where: { year: { $gte: 2020 } }

// Less than
where: { year: { $lt: 2024 } }

// Less than or equal
where: { year: { $lte: 2024 } }

// Not equal
where: { category: { $ne: 'spam' } }

// In list
where: { category: { $in: ['tech', 'science'] } }

// Not in list
where: { category: { $nin: ['spam', 'ads'] } }

// AND condition
where: {
  $and: [
    { category: 'tech' },
    { year: { $gte: 2020 } },
  ],
}

// OR condition
where: {
  $or: [
    { category: 'tech' },
    { category: 'science' },
  ],
}
```

### Update and Delete

#### Update Documents

```typescript
await collection.update({
  ids: ['id1'],
  documents: ['Updated document'],
  metadatas: [{ updated: true }],
})
```

#### Upsert (Update or Insert)

```typescript
await collection.upsert({
  ids: ['id1', 'id2'],
  documents: ['Doc 1', 'Doc 2'],
  metadatas: [{ source: 'api' }, { source: 'api' }],
})
```

#### Delete Documents

```typescript
// Delete by ID
await collection.delete({
  ids: ['id1', 'id2'],
})

// Delete with metadata filter
await collection.delete({
  where: { category: 'spam' },
})
```

### Get Documents

```typescript
// Get by ID
const docs = await collection.get({
  ids: ['id1', 'id2'],
})

// Get with metadata filter
const docs = await collection.get({
  where: { category: 'tech' },
  limit: 10,
})

// Get all documents
const docs = await collection.get()
```

### Complete RAG Example with Chroma

```typescript
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// Initialize Chroma client
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_CLOUD_URL,
  auth: {
    provider: 'token',
    credentials: process.env.CHROMA_API_KEY,
  },
})

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
  model_name: 'text-embedding-3-small',
})

// Get or create collection
const collection = await chromaClient.getOrCreateCollection({
  name: 'knowledge-base',
  embeddingFunction: embedder,
})

// Store documents (do this once)
async function storeDocuments(documents: Array<{ id: string; text: string; metadata: any }>) {
  await collection.add({
    ids: documents.map(d => d.id),
    documents: documents.map(d => d.text),
    metadatas: documents.map(d => d.metadata),
  })
}

// RAG API endpoint
export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the last user message
  const lastMessage = messages[messages.length - 1].content

  // Query Chroma for relevant context
  const results = await collection.query({
    queryTexts: [lastMessage],
    nResults: 3,
  })

  // Build context from results
  const context = results.documents[0]
    .map((doc, i) => {
      const metadata = results.metadatas[0][i]
      return `Source: ${metadata.source}\n${doc}`
    })
    .join('\n\n---\n\n')

  // Stream response with context
  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: `You are a helpful assistant. Use the following context to answer the user's question:

${context}

If the context doesn't contain relevant information, say so.`,
    messages,
  })

  return result.toDataStreamResponse()
}
```

---

## Deepgram

### Official Documentation
- **Main Docs**: https://developers.deepgram.com/
- **JavaScript SDK**: https://developers.deepgram.com/docs/js-sdk
- **Pre-recorded**: https://developers.deepgram.com/docs/pre-recorded-audio
- **Live Streaming**: https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio
- **GitHub**: https://github.com/deepgram/deepgram-js-sdk
- **NPM**: https://www.npmjs.com/package/@deepgram/sdk

### Installation

```bash
npm install @deepgram/sdk
```

### Setup

#### Get API Key

Sign up at https://console.deepgram.com/ and create a new API key.

#### Initialize Client

```typescript
import { createClient } from '@deepgram/sdk'

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY)
```

Or using environment variable:
```env
DEEPGRAM_API_KEY=your-api-key
```

```typescript
import { createClient } from '@deepgram/sdk'

// Automatically uses DEEPGRAM_API_KEY env variable
const deepgramClient = createClient()
```

### Pre-recorded Transcription

#### Transcribe from URL

```typescript
import { createClient } from '@deepgram/sdk'

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY)

const { result, error } = await deepgramClient.listen.prerecorded.transcribeUrl(
  {
    url: 'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav',
  },
  {
    model: 'nova-2',
    smart_format: true,
  }
)

if (error) throw error

console.log(result.results.channels[0].alternatives[0].transcript)
```

#### Transcribe from File

```typescript
import { createClient } from '@deepgram/sdk'
import fs from 'fs'

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY)

const audioFile = fs.readFileSync('path/to/audio.mp3')

const { result, error } = await deepgramClient.listen.prerecorded.transcribeFile(
  audioFile,
  {
    model: 'nova-2',
    smart_format: true,
    punctuate: true,
    paragraphs: true,
    utterances: true,
    diarize: true, // Speaker detection
  }
)

if (error) throw error

// Get transcript
const transcript = result.results.channels[0].alternatives[0].transcript

// Get paragraphs
const paragraphs = result.results.channels[0].alternatives[0].paragraphs

// Get utterances with speakers
const utterances = result.results.utterances
```

#### Advanced Options

```typescript
const { result } = await deepgramClient.listen.prerecorded.transcribeUrl(
  { url: audioUrl },
  {
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    punctuate: true,
    paragraphs: true,
    utterances: true,
    diarize: true,
    diarize_version: '2021-07-14.0',
    multichannel: true,
    alternatives: 3,
    numerals: true,
    search: ['keyword1', 'keyword2'],
    keywords: ['boost:2', 'important:1.5'],
    profanity_filter: false,
    redact: ['pci', 'ssn'],
    replace: ['old:new'],
    callback: 'https://your-callback-url.com',
    custom_topics: true,
    topics: true,
    intents: true,
    sentiment: true,
    summarize: true,
  }
)
```

### Live Streaming Transcription

#### Basic Live Transcription

```typescript
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY)

const connection = deepgramClient.listen.live({
  model: 'nova-2',
  language: 'en-US',
  smart_format: true,
  interim_results: true,
  utterance_end_ms: 1000,
  vad_events: true,
})

// Handle events
connection.on(LiveTranscriptionEvents.Open, () => {
  console.log('Connection opened')

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel.alternatives[0].transcript

    if (data.is_final) {
      console.log('Final:', transcript)
    } else {
      console.log('Interim:', transcript)
    }
  })

  connection.on(LiveTranscriptionEvents.Metadata, (data) => {
    console.log('Metadata:', data)
  })

  connection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error('Error:', error)
  })

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('Connection closed')
  })
})

// Send audio data
// audioSource is your audio stream (e.g., from microphone)
audioSource.on('data', (audioData) => {
  if (connection.getReadyState() === 1) {
    connection.send(audioData)
  }
})

// Close connection when done
setTimeout(() => {
  connection.finish()
}, 10000)
```

#### Next.js Live Transcription API Route

```typescript
// app/api/deepgram/route.ts
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

export const runtime = 'nodejs' // Use Node.js runtime for WebSocket support

export async function GET(req: Request) {
  const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY)

  const connection = deepgramClient.listen.live({
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    interim_results: true,
  })

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      connection.on(LiveTranscriptionEvents.Open, () => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'open' })}\n\n`)
      })

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0].transcript
        controller.enqueue(`data: ${JSON.stringify({
          type: 'transcript',
          transcript,
          is_final: data.is_final,
        })}\n\n`)
      })

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'error',
          error: error.message,
        })}\n\n`)
      })

      connection.on(LiveTranscriptionEvents.Close, () => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'close' })}\n\n`)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

#### Client Component for Live Transcription

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function LiveTranscription() {
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  async function startRecording() {
    setIsRecording(true)

    // Get microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)

    // Connect to Deepgram via your API
    const eventSource = new EventSource('/api/deepgram')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'transcript' && data.is_final) {
        setTranscript(prev => prev + ' ' + data.transcript)
      }
    }

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        // Send audio data to your API
        // You'll need to implement a POST endpoint for this
        await fetch('/api/deepgram/audio', {
          method: 'POST',
          body: event.data,
        })
      }
    }

    mediaRecorder.start(250) // Send data every 250ms
  }

  function stopRecording() {
    setIsRecording(false)
    // Clean up mediaRecorder and eventSource
  }

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Start'} Recording
      </button>
      <div>{transcript}</div>
    </div>
  )
}
```

### Complete Podcast Transcription Example

```typescript
import { createClient } from '@deepgram/sdk'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY)
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function transcribePodcast(audioUrl: string, podcastId: string) {
  // 1. Transcribe with Deepgram
  const { result, error } = await deepgramClient.listen.prerecorded.transcribeUrl(
    { url: audioUrl },
    {
      model: 'nova-2',
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      utterances: true,
      diarize: true,
      summarize: true,
      topics: true,
      intents: true,
    }
  )

  if (error) throw error

  const transcript = result.results.channels[0].alternatives[0].transcript
  const paragraphs = result.results.channels[0].alternatives[0].paragraphs.paragraphs
  const utterances = result.results.utterances
  const summary = result.results.summary

  // 2. Store in Supabase
  const { data, error: dbError } = await supabase
    .from('transcripts')
    .insert({
      podcast_id: podcastId,
      transcript: transcript,
      paragraphs: paragraphs,
      utterances: utterances,
      summary: summary,
      metadata: result.metadata,
    })
    .select()
    .single()

  if (dbError) throw dbError

  // 3. Generate embeddings and store in Chroma for RAG
  const chunks = chunkTranscript(transcript)

  for (const chunk of chunks) {
    await collection.add({
      ids: [`${podcastId}-${chunk.index}`],
      documents: [chunk.text],
      metadatas: [{
        podcast_id: podcastId,
        timestamp: chunk.timestamp,
        speaker: chunk.speaker,
      }],
    })
  }

  return data
}

function chunkTranscript(transcript: string, chunkSize: number = 500) {
  // Split transcript into chunks for RAG
  const words = transcript.split(' ')
  const chunks = []

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push({
      index: i / chunkSize,
      text: words.slice(i, i + chunkSize).join(' '),
      timestamp: null, // Calculate from utterances if needed
    })
  }

  return chunks
}
```

---

## Model Context Protocol (MCP)

### Official Documentation
- **Main Site**: https://modelcontextprotocol.io/
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Servers Repo**: https://github.com/modelcontextprotocol/servers
- **AI SDK Integration**: https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
- **Supabase MCP**: https://supabase.com/docs/guides/getting-started/mcp

### What is MCP?

Model Context Protocol (MCP) is a standardized way for Large Language Models (LLMs) to connect to external tools, data sources, and services. It provides:

- **Tools**: Functions that LLMs can call
- **Resources**: Data sources that LLMs can read
- **Prompts**: Pre-built prompt templates

### Official MCP Servers

#### Core Reference Servers

**Filesystem**
```bash
npx @modelcontextprotocol/server-filesystem /path/to/allowed/dir
```
- Secure file operations
- Configurable access controls
- Read, write, search files

**Fetch**
```bash
npx @modelcontextprotocol/server-fetch
```
- Web content fetching
- Converts HTML to markdown
- Efficient for LLM consumption

**Memory**
```bash
npx @modelcontextprotocol/server-memory
```
- Knowledge graph-based persistent memory
- Store and retrieve information across sessions

**Git**
```bash
npx @modelcontextprotocol/server-git
```
- Read, search, and manipulate Git repositories
- View commits, branches, diffs

**GitHub**
```bash
npx @modelcontextprotocol/server-github
```
- Repository management
- Issue and PR operations
- Search code and users

**Postgres**
```bash
npx @modelcontextprotocol/server-postgres
```
- Query PostgreSQL databases
- Execute SQL commands

### Supabase MCP Server

**Official Docs**: https://supabase.com/docs/guides/getting-started/mcp

#### Installation

```bash
npm install @supabase-community/mcp-server-supabase
```

#### Configuration

Create `mcp.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase-community/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "your-project-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

#### Features

The Supabase MCP server provides:
- Table management (create, alter, drop)
- Query data with SQL
- Deploy Edge Functions
- Fetch project configuration
- Manage storage buckets

**Security Note**: Use with development projects only, not production.

### Using MCP with Vercel AI SDK

**Official Docs**: https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools

#### Installation

```bash
npm install @ai-sdk/mcp
```

#### Basic Setup

```typescript
import { createMcpClient } from '@ai-sdk/mcp'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

// Create MCP client
const mcpClient = createMcpClient({
  servers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
    memory: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
})

// Get tools from MCP servers
const tools = await mcpClient.tools()

// Use with AI SDK
export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools,
  })

  return result.toDataStreamResponse()
}
```

#### Multiple MCP Servers

```typescript
const mcpClient = createMcpClient({
  servers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    },
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      },
    },
    supabase: {
      command: 'npx',
      args: ['-y', '@supabase-community/mcp-server-supabase'],
      env: {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
    memory: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
})

const tools = await mcpClient.tools()
```

#### Next.js API Route with MCP

```typescript
// app/api/chat/route.ts
import { createMcpClient } from '@ai-sdk/mcp'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = 'nodejs' // MCP requires Node.js runtime

const mcpClient = createMcpClient({
  servers: {
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        process.cwd() + '/data',
      ],
    },
    memory: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const tools = await mcpClient.tools()

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools,
    stopWhen: (step) => step.finishReason === 'stop',
  })

  return result.toDataStreamResponse()
}
```

### Building Custom MCP Servers

**Official TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk

#### Installation

```bash
npm install @modelcontextprotocol/sdk
```

#### Create MCP Server

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const server = new Server(
  {
    name: 'my-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather',
        description: 'Get weather for a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location to get weather for',
            },
          },
          required: ['location'],
        },
      },
    ],
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_weather') {
    const location = request.params.arguments?.location as string

    // Implement your logic
    const weather = await getWeather(location)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weather),
        },
      ],
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`)
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main()
```

#### Package.json for MCP Server

```json
{
  "name": "my-mcp-server",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "my-mcp-server": "./build/index.js"
  },
  "files": ["build"],
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

### Common MCP Use Cases for This Stack

#### 1. Podcast Management MCP Server

```typescript
// Tools for managing podcasts
- list_podcasts: Get all podcasts
- get_podcast: Get specific podcast details
- search_podcasts: Search podcasts by query
- get_transcript: Get podcast transcript
- add_podcast: Add new podcast to database
```

#### 2. Supabase MCP Integration

```typescript
const mcpClient = createMcpClient({
  servers: {
    supabase: {
      command: 'npx',
      args: ['-y', '@supabase-community/mcp-server-supabase'],
      env: {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  },
})
```

#### 3. Chroma Vector Database MCP

```bash
npm install chroma-mcp
```

```typescript
const mcpClient = createMcpClient({
  servers: {
    chroma: {
      command: 'npx',
      args: ['-y', 'chroma-mcp'],
      env: {
        CHROMA_URL: process.env.CHROMA_CLOUD_URL,
        CHROMA_API_KEY: process.env.CHROMA_API_KEY,
      },
    },
  },
})
```

---

## Complete Integration Example

Here's a complete example bringing together all the technologies:

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { ChromaClient } from 'chromadb'
import { createClient as createDeepgramClient } from '@deepgram/sdk'
import { createMcpClient } from '@ai-sdk/mcp'

export const runtime = 'nodejs'

// Initialize clients
const supabase = createClient()
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_CLOUD_URL,
  auth: { provider: 'token', credentials: process.env.CHROMA_API_KEY },
})
const deepgramClient = createDeepgramClient(process.env.DEEPGRAM_API_KEY)

const mcpClient = createMcpClient({
  servers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', './data'],
    },
    memory: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get MCP tools
  const mcpTools = await mcpClient.tools()

  // Define custom tools
  const customTools = {
    searchPodcasts: tool({
      description: 'Search podcast transcripts',
      parameters: z.object({
        query: z.string().describe('The search query'),
      }),
      execute: async ({ query }) => {
        const collection = await chromaClient.getCollection({
          name: 'podcast-transcripts',
        })

        const results = await collection.query({
          queryTexts: [query],
          nResults: 5,
        })

        return {
          podcasts: results.documents[0],
          metadata: results.metadatas[0],
        }
      },
    }),

    transcribePodcast: tool({
      description: 'Transcribe a podcast audio file',
      parameters: z.object({
        audioUrl: z.string().describe('URL to the audio file'),
        podcastId: z.string().describe('ID of the podcast'),
      }),
      execute: async ({ audioUrl, podcastId }) => {
        // Transcribe with Deepgram
        const { result } = await deepgramClient.listen.prerecorded.transcribeUrl(
          { url: audioUrl },
          {
            model: 'nova-2',
            smart_format: true,
            diarize: true,
            summarize: true,
          }
        )

        const transcript = result.results.channels[0].alternatives[0].transcript

        // Store in Supabase
        await supabase
          .from('transcripts')
          .insert({
            podcast_id: podcastId,
            transcript: transcript,
          })

        // Store in Chroma for RAG
        const collection = await chromaClient.getCollection({
          name: 'podcast-transcripts',
        })

        await collection.add({
          ids: [podcastId],
          documents: [transcript],
          metadatas: [{ podcast_id: podcastId }],
        })

        return { success: true, transcript }
      },
    }),
  }

  // Combine all tools
  const tools = { ...customTools, ...mcpTools }

  // Stream response
  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools,
    stopWhen: (step) => step.finishReason === 'stop',
  })

  return result.toDataStreamResponse()
}
```

**Client Component:**
```typescript
'use client'

import { useChat } from '@ai-sdk/react'
import { Conversation } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { PromptInput } from '@/components/ai-elements/prompt-input'
import { Tool } from '@/components/ai-elements/tool'
import { CodeBlock } from '@/components/ai-elements/code-block'

export default function PodcastChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  })

  return (
    <div className="flex flex-col h-screen">
      <Conversation>
        {messages.map(message => (
          <Message key={message.id} role={message.role}>
            <MessageContent>
              {message.content}
            </MessageContent>

            {message.toolInvocations?.map((tool) => (
              <Tool
                key={tool.toolCallId}
                name={tool.toolName}
                status={tool.state}
                result={
                  tool.state === 'result' && (
                    <CodeBlock
                      language="json"
                      code={JSON.stringify(tool.result, null, 2)}
                    />
                  )
                }
              />
            ))}
          </Message>
        ))}
      </Conversation>

      <PromptInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        placeholder="Ask about podcasts..."
        disabled={isLoading}
      />
    </div>
  )
}
```

---

## Environment Variables

Create a `.env.local` file with all required keys:

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Taddy (Podcast Data)
TADDY_USER_ID=your-taddy-user-id
TADDY_API_KEY=your-taddy-api-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Chroma Cloud
CHROMA_CLOUD_URL=https://api.trychroma.com
CHROMA_API_KEY=your-chroma-key
CHROMA_TENANT=your-tenant
CHROMA_DATABASE=your-database

# Deepgram (Transcription Fallback)
DEEPGRAM_API_KEY=your-deepgram-key

# Trigger.dev (Background Jobs)
TRIGGER_SECRET_KEY=your-trigger-secret-key
```

---

## Quick Start Commands

```bash
# Create new Next.js project
npx create-next-app@latest podcast-chat --typescript --tailwind --app

# Install all dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @clerk/nextjs
npm install ai @ai-sdk/openai @ai-sdk/react @ai-sdk/mcp
npm install chromadb @chroma-core/default-embed
npm install @deepgram/sdk
npm install zod

# Install shadcn/ui
npx shadcn@latest init

# Install AI Elements
npx shadcn@latest add https://registry.ai-sdk.dev/all.json

# Add shadcn components
npx shadcn@latest add button card dialog input textarea
```

---

This documentation provides a comprehensive foundation for building your podcast chat application with the full technology stack!
