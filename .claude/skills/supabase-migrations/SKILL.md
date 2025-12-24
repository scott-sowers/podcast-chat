---
name: supabase-migrations
description: This skill should be used when creating or modifying Supabase database migrations. It applies when writing SQL migration files, creating tables with Row Level Security (RLS) policies, adding columns, or making any DDL changes to a Supabase database. The skill ensures migrations follow proper naming conventions, include comprehensive RLS policies, and adhere to Supabase best practices.
---

# Supabase Migrations

## Overview

This skill provides guidance for creating secure, well-documented Supabase database migrations. It ensures all migrations follow proper naming conventions, include Row Level Security (RLS) policies, and adhere to Postgres and Supabase best practices.

## When to Use This Skill

- Creating new database tables
- Adding, modifying, or removing columns
- Setting up Row Level Security policies
- Creating indexes, functions, or triggers
- Any DDL (Data Definition Language) operations on a Supabase database

## Migration File Creation Workflow

### Step 1: Determine the Migration File Name

Migration files MUST be named in the format `YYYYMMDDHHmmss_short_description.sql` using UTC time:

- `YYYY` - Four digits for the year
- `MM` - Two digits for the month (01-12)
- `DD` - Two digits for the day (01-31)
- `HH` - Two digits for the hour in 24-hour format (00-23)
- `mm` - Two digits for the minute (00-59)
- `ss` - Two digits for the second (00-59)

Example: `20240906123045_create_profiles.sql`

To generate a migration with a proper timestamp, use the script:
```bash
python scripts/new_migration.py <description> --path supabase/migrations
```

### Step 2: Write the Migration Header

Every migration file should start with a header comment:

```sql
-- =============================================================================
-- Migration: <timestamp>_<description>.sql
-- Purpose: <brief description of what this migration does>
-- Affected Tables: <list of tables affected>
-- Affected Columns: <list of columns added/modified/removed>
-- Special Considerations: <any rollback notes, data migration concerns>
-- =============================================================================
```

### Step 3: Write SQL in Lowercase

All SQL keywords and identifiers should be lowercase:

```sql
-- correct
create table public.profiles (
  id bigint primary key generated always as identity,
  name text not null
);

-- incorrect
CREATE TABLE public.profiles (
  ID BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  Name TEXT NOT NULL
);
```

### Step 4: Enable Row Level Security (REQUIRED)

RLS MUST be enabled on every table in the public schema:

```sql
alter table public.<table_name> enable row level security;
```

### Step 5: Create Granular RLS Policies

Create separate policies for each operation (select, insert, update, delete) and each role (anon, authenticated):

```sql
-- SELECT policy for authenticated users
create policy "select_<table>_owner"
  on public.<table_name>
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT policy for authenticated users
create policy "insert_<table>_authenticated"
  on public.<table_name>
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE policy for authenticated users
create policy "update_<table>_owner"
  on public.<table_name>
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE policy for authenticated users
create policy "delete_<table>_owner"
  on public.<table_name>
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
```

**IMPORTANT**: Always wrap `auth.uid()` and `auth.jwt()` in a select for performance:
```sql
-- GOOD (cached per-statement)
using ((select auth.uid()) = user_id)

-- BAD (called per-row, slow)
using (auth.uid() = user_id)
```

### Step 6: Add Comments for Destructive Operations

Any destructive SQL commands (truncate, drop, alter column type) must include copious comments:

```sql
-- =============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- This will permanently delete the <column_name> column and ALL its data
-- Ensure backups exist before proceeding
-- =============================================================================
alter table public.<table_name> drop column if exists <column_name>;
```

## Applying Migrations

### Using Supabase MCP (Preferred)

When the Supabase MCP is available, use `mcp__supabase__apply_migration`:

```
Tool: mcp__supabase__apply_migration
Parameters:
  - name: snake_case migration name (e.g., "create_profiles_table")
  - query: the full SQL migration content
```

### Using Supabase CLI

```bash
# Generate new migration file
supabase migration new <description>

# Apply pending migrations
supabase migration up

# Reset database and reapply all migrations
supabase db reset

# Generate diff from schema changes
supabase db diff -f <description>

# Push migrations to remote
supabase db push
```

## Complete Table Creation Example

```sql
-- =============================================================================
-- Migration: 20241223160000_create_profiles.sql
-- Purpose: Create user profiles table with RLS policies
-- Affected Tables: profiles
-- Affected Columns: id, user_id, username, avatar_url, bio, created_at, updated_at
-- Special Considerations: References auth.users, requires user_id index for RLS
-- =============================================================================

-- create the profiles table
create table if not exists public.profiles (
  -- primary key
  id bigint primary key generated always as identity,
  
  -- foreign key to auth.users
  user_id uuid references auth.users(id) on delete cascade not null unique,
  
  -- profile fields
  username text unique not null,
  avatar_url text,
  bio text,
  
  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comment
comment on table public.profiles is 'User profile information';

-- enable row level security (REQUIRED)
alter table public.profiles enable row level security;

-- =============================================================================
-- Row Level Security Policies
-- =============================================================================

-- SELECT: public profiles are viewable by everyone
create policy "select_profiles_public"
  on public.profiles
  for select
  to anon
  using (true);

create policy "select_profiles_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- INSERT: users can only create their own profile
create policy "insert_profiles_authenticated"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: users can only update their own profile
create policy "update_profiles_owner"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: users can only delete their own profile
create policy "delete_profiles_owner"
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- Indexes
-- =============================================================================

-- index for user_id lookups (required for RLS performance)
create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- index for username lookups
create index if not exists idx_profiles_username on public.profiles(username);
```

## Resources

### scripts/

- `new_migration.py` - Generate new migration files with proper timestamps and templates

### references/

- `migration-guidelines.md` - Comprehensive patterns for tables, columns, RLS policies, indexes, functions, and common anti-patterns to avoid

For detailed patterns including enum types, trigger functions, foreign key options, and security definer functions, consult the migration-guidelines.md reference file.
