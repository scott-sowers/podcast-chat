# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Podcast Chat is a Next.js 16 application that enables AI-powered conversations with podcast content. Users can search podcasts, sync transcripts, and chat with episode content.

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS
- **Planned integrations**: Clerk (auth), Supabase (database), Vercel AI SDK, ChromaDB (vector DB), Deepgram (transcription), Trigger.dev (background jobs)

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

```
src/app/         # Next.js App Router - server components by default
  layout.tsx     # Root layout with metadata and Geist fonts
  page.tsx       # Home page
  globals.css    # Tailwind styles and CSS custom properties
```

Uses `@/*` path alias for imports from `src/`.

## TypeScript

- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- Target: ES2017

## Styling

- Tailwind CSS with CSS custom properties for theming
- Dark mode via `prefers-color-scheme` media query
- Font variables: `--font-geist-sans`, `--font-geist-mono`

## Documentation

Detailed specifications in `documenation/`:
- `PRD.md` - Product requirements and feature specs
- `TECH_STACK_DOCUMENTATION.md` - Detailed technical specifications
- `QUICK_REFERENCE.md` - Setup links and environment variables
