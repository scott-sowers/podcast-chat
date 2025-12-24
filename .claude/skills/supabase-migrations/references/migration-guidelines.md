# Supabase Migration Guidelines Reference

This reference provides comprehensive patterns and best practices for creating Supabase migrations.

## Migration File Naming Convention

Migration files MUST be named in the format `YYYYMMDDHHmmss_short_description.sql`:

- `YYYY` - Four digits for the year (e.g., `2024`)
- `MM` - Two digits for the month (01 to 12)
- `DD` - Two digits for the day of the month (01 to 31)
- `HH` - Two digits for the hour in 24-hour format (00 to 23)
- `mm` - Two digits for the minute (00 to 59)
- `ss` - Two digits for the second (00 to 59)
- Description should use snake_case

Examples:
```
20240906123045_create_profiles.sql
20241215143022_add_user_preferences_column.sql
20250101000000_create_organizations_table.sql
```

## Migration File Header Template

Every migration file should start with a header comment:

```sql
-- =============================================================================
-- Migration: <timestamp>_<description>.sql
-- Purpose: <brief description of what this migration does>
-- Affected Tables: <list of tables affected>
-- Affected Columns: <list of columns added/modified/removed>
-- Special Considerations: <any rollback notes, data migration concerns, etc.>
-- =============================================================================
```

## SQL Style Guidelines

### General Formatting

- Write all SQL keywords in lowercase
- Use consistent indentation (2 spaces)
- Add blank lines between logical sections
- Use double quotes for identifiers that need quoting

### Table Creation Pattern

```sql
-- create the <table_name> table
-- purpose: <explain what this table stores>
create table if not exists public.<table_name> (
  -- primary key
  id bigint primary key generated always as identity,
  
  -- foreign keys
  user_id uuid references auth.users(id) on delete cascade,
  
  -- required fields
  name text not null,
  
  -- optional fields with defaults
  status text not null default 'active',
  is_active boolean not null default true,
  
  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comment for documentation
comment on table public.<table_name> is '<description of what this table stores>';

-- create indexes for frequently queried columns
create index if not exists idx_<table_name>_user_id on public.<table_name>(user_id);
create index if not exists idx_<table_name>_created_at on public.<table_name>(created_at);
```

## Row Level Security (RLS) Patterns

### RLS MUST Always Be Enabled

CRITICAL: RLS must always be enabled on any tables in the public schema:

```sql
-- enable row level security
-- IMPORTANT: this is required for all tables in public schema
alter table public.<table_name> enable row level security;
```

### Policy Naming Convention

Policies should be named descriptively:
- `<action>_<table>_<scope>` format
- Examples: `select_profiles_authenticated`, `insert_posts_owner`, `delete_comments_author`

### Granular RLS Policies

Create separate policies for each operation and role combination:

```sql
-- =============================================================================
-- Row Level Security Policies for <table_name>
-- =============================================================================

-- SELECT Policies
-- ---------------

-- policy: allow authenticated users to view their own records
-- rationale: users should only see data they own
create policy "select_<table>_owner"
  on public.<table_name>
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- policy: allow anonymous users to view public records
-- rationale: public data should be accessible without authentication
create policy "select_<table>_anon"
  on public.<table_name>
  for select
  to anon
  using (is_public = true);

-- INSERT Policies
-- ---------------

-- policy: allow authenticated users to insert their own records
-- rationale: users can only create records for themselves
create policy "insert_<table>_authenticated"
  on public.<table_name>
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- policy: anonymous users cannot insert records
-- rationale: require authentication for data creation
-- (no policy needed - absence of policy denies by default)

-- UPDATE Policies
-- ---------------

-- policy: allow authenticated users to update their own records
-- rationale: users can only modify their own data
create policy "update_<table>_owner"
  on public.<table_name>
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE Policies
-- ---------------

-- policy: allow authenticated users to delete their own records
-- rationale: users can only remove their own data
create policy "delete_<table>_owner"
  on public.<table_name>
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
```

### Public Access Table Pattern

For tables intended for full public access:

```sql
-- policy: allow public read access
-- rationale: this table contains public reference data
create policy "select_<table>_public"
  on public.<table_name>
  for select
  to anon
  using (true);

create policy "select_<table>_authenticated"
  on public.<table_name>
  for select
  to authenticated
  using (true);
```

### RLS Performance Optimizations

```sql
-- IMPORTANT: wrap auth functions in select for performance
-- this caches the result per-statement instead of per-row

-- bad (slow):
using (auth.uid() = user_id)

-- good (fast):
using ((select auth.uid()) = user_id)

-- for JWT claims:
-- bad:
using (auth.jwt() ->> 'role' = 'admin')

-- good:
using ((select auth.jwt() ->> 'role') = 'admin')
```

## Column Modification Patterns

### Adding Columns

```sql
-- add <column_name> column to <table_name>
-- purpose: <why this column is needed>
alter table public.<table_name>
  add column <column_name> <type> <constraints>;

-- if adding not null column to existing table with data:
-- step 1: add nullable column
alter table public.<table_name>
  add column <column_name> <type>;

-- step 2: backfill existing rows (if needed)
update public.<table_name>
  set <column_name> = <default_value>
  where <column_name> is null;

-- step 3: add not null constraint
alter table public.<table_name>
  alter column <column_name> set not null;
```

### Modifying Columns

```sql
-- WARNING: modifying column types may cause data loss
-- ensure data compatibility before running

-- change column type
alter table public.<table_name>
  alter column <column_name> type <new_type> using <column_name>::<new_type>;

-- add constraint
alter table public.<table_name>
  add constraint <constraint_name> check (<condition>);
```

## Destructive Operations

### Dropping Tables

```sql
-- =============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- This will permanently delete the <table_name> table and ALL its data
-- Ensure backups exist before proceeding
-- =============================================================================

-- drop all policies first
drop policy if exists "select_<table>_owner" on public.<table_name>;
drop policy if exists "insert_<table>_authenticated" on public.<table_name>;
drop policy if exists "update_<table>_owner" on public.<table_name>;
drop policy if exists "delete_<table>_owner" on public.<table_name>;

-- drop the table
drop table if exists public.<table_name>;
```

### Dropping Columns

```sql
-- =============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- This will permanently delete the <column_name> column and ALL its data
-- =============================================================================

alter table public.<table_name>
  drop column if exists <column_name>;
```

### Truncating Tables

```sql
-- =============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- This will delete ALL data from <table_name> but preserve the table structure
-- =============================================================================

truncate table public.<table_name> restart identity cascade;
```

## Foreign Key Patterns

```sql
-- foreign key with cascade delete
-- when parent record is deleted, child records are also deleted
user_id uuid references auth.users(id) on delete cascade

-- foreign key with set null
-- when parent record is deleted, this column becomes null
category_id bigint references public.categories(id) on delete set null

-- foreign key with restrict (default)
-- prevents deletion of parent record if child records exist
organization_id bigint references public.organizations(id) on delete restrict
```

## Index Patterns

```sql
-- standard btree index for equality and range queries
create index if not exists idx_<table>_<column>
  on public.<table_name>(<column_name>);

-- composite index for multi-column queries
create index if not exists idx_<table>_<col1>_<col2>
  on public.<table_name>(<column1>, <column2>);

-- partial index for subset of rows
create index if not exists idx_<table>_<column>_active
  on public.<table_name>(<column_name>)
  where is_active = true;

-- gin index for array or jsonb columns
create index if not exists idx_<table>_<column>_gin
  on public.<table_name> using gin(<column_name>);
```

## Function Patterns

### Helper Functions for RLS

```sql
-- create private schema for security definer functions
create schema if not exists private;

-- security definer function to check user roles
-- IMPORTANT: security definer functions should never be in exposed schemas
create or replace function private.get_user_role(user_id uuid)
returns text
language sql
security definer
set search_path = ''
as $$
  select role from public.user_roles
  where user_id = $1;
$$;
```

### Trigger Functions

```sql
-- function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- create trigger for automatic timestamp updates
create trigger handle_<table>_updated_at
  before update on public.<table_name>
  for each row
  execute function public.handle_updated_at();
```

## Enum Type Patterns

```sql
-- create enum type
create type public.status_type as enum ('draft', 'published', 'archived');

-- use enum in table
create table public.posts (
  id bigint primary key generated always as identity,
  status public.status_type not null default 'draft'
);

-- add new value to existing enum
alter type public.status_type add value 'pending' before 'published';
```

## Supabase MCP Integration

When the Supabase MCP is available, use `mcp__supabase__apply_migration` for DDL operations:

```
Tool: mcp__supabase__apply_migration
Parameters:
  - name: snake_case migration name (without timestamp)
  - query: the SQL migration content
```

For data queries (not DDL), use `mcp__supabase__execute_sql`:
```
Tool: mcp__supabase__execute_sql
Parameters:
  - query: the SQL query to execute
```

## Common Anti-Patterns to Avoid

### 1. Forgetting to enable RLS
```sql
-- WRONG: table without RLS
create table public.sensitive_data (
  id bigint primary key generated always as identity,
  secret text
);

-- CORRECT: always enable RLS
create table public.sensitive_data (
  id bigint primary key generated always as identity,
  secret text
);
alter table public.sensitive_data enable row level security;
```

### 2. Combining policies for different roles
```sql
-- WRONG: single policy for both roles
create policy "users_access"
  on public.posts
  for all
  using (true);

-- CORRECT: separate policies per role and operation
create policy "select_posts_anon"
  on public.posts
  for select
  to anon
  using (is_public = true);

create policy "select_posts_authenticated"
  on public.posts
  for select
  to authenticated
  using ((select auth.uid()) = user_id or is_public = true);
```

### 3. Missing performance optimizations
```sql
-- WRONG: no index on filtered columns
create policy "select_posts_owner"
  on public.posts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
-- user_id should be indexed!

-- CORRECT: ensure indexed columns for RLS
create index idx_posts_user_id on public.posts(user_id);
```

### 4. Not using select wrapper for auth functions
```sql
-- WRONG: auth function called per row
using (auth.uid() = user_id)

-- CORRECT: cached with select wrapper
using ((select auth.uid()) = user_id)
```

## Testing Migrations

Before applying migrations to production:

1. Test locally with `supabase start` and `supabase migration up`
2. Use `supabase db reset` to verify migrations apply cleanly from scratch
3. Review generated migrations with `supabase db diff` when using declarative schemas
4. Check RLS policies work correctly with different user contexts
5. Verify indexes are created for RLS policy columns
