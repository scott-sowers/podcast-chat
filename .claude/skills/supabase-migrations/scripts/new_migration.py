#!/usr/bin/env python3
"""
Generate a new Supabase migration file with proper timestamp and header.

Usage:
    python new_migration.py <description> [--path <supabase/migrations>]

Example:
    python new_migration.py create_profiles_table
    python new_migration.py add_user_preferences --path ./supabase/migrations
"""

import argparse
import os
import sys
from datetime import datetime, timezone


def generate_timestamp() -> str:
    """Generate UTC timestamp in YYYYMMDDHHmmss format."""
    now = datetime.now(timezone.utc)
    return now.strftime("%Y%m%d%H%M%S")


def sanitize_description(description: str) -> str:
    """Convert description to snake_case and sanitize."""
    # Replace spaces and hyphens with underscores
    sanitized = description.replace(" ", "_").replace("-", "_")
    # Remove any characters that aren't alphanumeric or underscore
    sanitized = "".join(c for c in sanitized if c.isalnum() or c == "_")
    # Convert to lowercase
    sanitized = sanitized.lower()
    # Remove consecutive underscores
    while "__" in sanitized:
        sanitized = sanitized.replace("__", "_")
    # Remove leading/trailing underscores
    return sanitized.strip("_")


def generate_header(filename: str, description: str) -> str:
    """Generate migration file header."""
    return f"""-- =============================================================================
-- Migration: {filename}
-- Purpose: TODO: Describe what this migration does
-- Affected Tables: TODO: List tables affected
-- Affected Columns: TODO: List columns added/modified/removed
-- Special Considerations: TODO: Any rollback notes, data migration concerns
-- =============================================================================

"""


def generate_template_content(description: str) -> str:
    """Generate template SQL content based on description."""
    desc_lower = description.lower()

    if "create" in desc_lower and "table" in desc_lower:
        # Extract table name from description
        parts = desc_lower.replace("create_", "").replace("_table", "")
        table_name = sanitize_description(parts)
        return f"""-- create the {table_name} table
create table if not exists public.{table_name} (
  -- primary key
  id bigint primary key generated always as identity,

  -- foreign keys (uncomment and modify as needed)
  -- user_id uuid references auth.users(id) on delete cascade,

  -- required fields
  name text not null,

  -- optional fields with defaults
  -- status text not null default 'active',

  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comment
comment on table public.{table_name} is 'TODO: Describe what this table stores';

-- enable row level security (REQUIRED for all public schema tables)
alter table public.{table_name} enable row level security;

-- =============================================================================
-- Row Level Security Policies
-- =============================================================================

-- SELECT Policies

-- policy: allow authenticated users to view their own records
-- rationale: TODO: explain policy rationale
create policy "select_{table_name}_owner"
  on public.{table_name}
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- policy: anonymous users (uncomment if public access needed)
-- create policy "select_{table_name}_anon"
--   on public.{table_name}
--   for select
--   to anon
--   using (true);

-- INSERT Policies

-- policy: allow authenticated users to insert their own records
create policy "insert_{table_name}_authenticated"
  on public.{table_name}
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE Policies

-- policy: allow authenticated users to update their own records
create policy "update_{table_name}_owner"
  on public.{table_name}
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE Policies

-- policy: allow authenticated users to delete their own records
create policy "delete_{table_name}_owner"
  on public.{table_name}
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- Indexes
-- =============================================================================

-- index for user_id lookups (required for RLS performance)
-- create index if not exists idx_{table_name}_user_id on public.{table_name}(user_id);

-- index for created_at ordering
create index if not exists idx_{table_name}_created_at on public.{table_name}(created_at);
"""

    elif "add" in desc_lower and "column" in desc_lower:
        return """-- add new column
-- WARNING: if adding NOT NULL column to table with existing data,
-- follow the three-step process in migration-guidelines.md

alter table public.<table_name>
  add column <column_name> <type> <constraints>;

-- add comment explaining the column
comment on column public.<table_name>.<column_name> is 'TODO: describe column purpose';
"""

    elif "drop" in desc_lower or "delete" in desc_lower or "remove" in desc_lower:
        return """-- =============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- This migration performs destructive changes that cannot be easily reversed
-- Ensure backups exist and this has been tested before applying to production
-- =============================================================================

-- TODO: add destructive SQL here

-- drop column example:
-- alter table public.<table_name> drop column if exists <column_name>;

-- drop table example (drop policies first):
-- drop policy if exists "policy_name" on public.<table_name>;
-- drop table if exists public.<table_name>;
"""

    else:
        return """-- TODO: add migration SQL here

-- refer to references/migration-guidelines.md for patterns and best practices
"""


def create_migration(description: str, migrations_path: str) -> str:
    """Create a new migration file."""
    timestamp = generate_timestamp()
    safe_description = sanitize_description(description)
    filename = f"{timestamp}_{safe_description}.sql"
    filepath = os.path.join(migrations_path, filename)

    # Ensure migrations directory exists
    os.makedirs(migrations_path, exist_ok=True)

    # Generate content
    header = generate_header(filename, description)
    template = generate_template_content(description)
    content = header + template

    # Write file
    with open(filepath, "w") as f:
        f.write(content)

    return filepath


def main():
    parser = argparse.ArgumentParser(
        description="Generate a new Supabase migration file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python new_migration.py create_profiles_table
    python new_migration.py add_avatar_url_column
    python new_migration.py drop_legacy_data
    python new_migration.py "add user preferences" --path ./supabase/migrations
        """
    )
    parser.add_argument(
        "description",
        help="Migration description (will be converted to snake_case)"
    )
    parser.add_argument(
        "--path",
        default="supabase/migrations",
        help="Path to migrations directory (default: supabase/migrations)"
    )

    args = parser.parse_args()

    if not args.description:
        print("Error: Description is required", file=sys.stderr)
        sys.exit(1)

    filepath = create_migration(args.description, args.path)
    print(f"Created migration: {filepath}")


if __name__ == "__main__":
    main()
