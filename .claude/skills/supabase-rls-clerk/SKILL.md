---
name: supabase-rls-clerk
description: This skill should be used when creating or modifying Row Level Security (RLS) policies in Supabase with Clerk Third-Party Auth integration. It applies when writing SQL policies for tables, troubleshooting RLS performance issues, or implementing user-based access control. The skill uses auth.jwt() to access Clerk user IDs via the sub claim and follows Supabase RLS best practices for performance.
---

# Supabase RLS Policies with Clerk Third-Party Auth

This skill provides guidance for creating Row Level Security (RLS) policies in Supabase when using Clerk as the authentication provider via the official Third-Party Auth integration.

## Important: Clerk Third-Party Auth vs Legacy JWT Template

This skill is for the **official Third-Party Auth integration** (recommended). The legacy JWT template method (`getToken({ template: 'supabase' })`) is deprecated as of April 1, 2025.

With Third-Party Auth:
- Use `auth.jwt()->>'sub'` to access the Clerk user ID
- No custom `auth.user_id()` function needed
- Clerk session tokens work directly with Supabase

## Core Principles

### 1. Policy Structure Rules

- **SELECT policies**: Use `USING` clause only, never `WITH CHECK`
- **INSERT policies**: Use `WITH CHECK` clause only, never `USING`
- **UPDATE policies**: Use both `USING` (which rows) and `WITH CHECK` (new values valid)
- **DELETE policies**: Use `USING` clause only, never `WITH CHECK`
- **Never use `FOR ALL`**: Create separate policies for SELECT, INSERT, UPDATE, DELETE
- **Always specify roles**: Use `TO authenticated` or `TO anon` explicitly

### 2. Clerk JWT Claims

With Clerk Third-Party Auth, access JWT claims via `auth.jwt()`:

| Claim | Access Pattern | Description |
|-------|----------------|-------------|
| User ID | `auth.jwt()->>'sub'` | Clerk user ID (e.g., `user_2abc123`) |
| Session ID | `auth.jwt()->>'sid'` | Current session ID |
| Org ID | `auth.jwt()->'o'->>'id'` | Active organization ID |
| Org Role | `auth.jwt()->'o'->>'rol'` | User's role in org (without `org:` prefix) |
| Org Slug | `auth.jwt()->'o'->>'slg'` | Organization slug |

For complete claim reference, see `references/clerk-jwt-claims.md`.

### 3. Performance-Critical Patterns

**Always wrap function calls in `(select ...)`** for performance:

```sql
-- BAD: Function called per row (slow)
USING (auth.jwt()->>'sub' = user_id)

-- GOOD: Function cached via initPlan (fast)
USING ((select auth.jwt()->>'sub') = user_id)
```

**Always add indexes on policy columns**:

```sql
CREATE INDEX idx_table_user_id ON my_table(user_id);
```

**Avoid joins in policies** - use subqueries that filter on fixed values:

```sql
-- BAD: Joins source table to target (slow)
USING (user_id IN (
  SELECT user_id FROM team_members WHERE team_id = my_table.team_id
))

-- GOOD: Fetches allowed values first (fast)
USING (team_id IN (
  SELECT team_id FROM team_members WHERE user_id = (select auth.jwt()->>'sub')
))
```

## Workflow

### Step 1: Retrieve Schema Information

Before writing policies, query the schema to understand the table structure:

```sql
-- Get table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'your_table';

-- Check existing policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table';
```

When Supabase MCP is available, use `mcp__supabase__list_tables` and `mcp__supabase__execute_sql` for these queries.

### Step 2: Enable RLS on the Table

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Step 3: Create Policies by Operation

Generate separate policies for each operation needed.

**Template for user-owned data:**

```sql
-- SELECT: Users can view their own records
CREATE POLICY "Users can view own records"
ON your_table
FOR SELECT
TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id);

-- INSERT: Users can create records for themselves
CREATE POLICY "Users can insert own records"
ON your_table
FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

-- UPDATE: Users can update their own records
CREATE POLICY "Users can update own records"
ON your_table
FOR UPDATE
TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id)
WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

-- DELETE: Users can delete their own records
CREATE POLICY "Users can delete own records"
ON your_table
FOR DELETE
TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id);
```

### Step 4: Add Required Indexes

```sql
CREATE INDEX idx_your_table_clerk_user_id ON your_table(clerk_user_id);
```

## Common Patterns

For detailed pattern examples including organization-based access, team membership, and public/private visibility, see `references/rls-patterns.md`.

### Pattern: User Profile Linked Access

When user data is in a separate `user_profiles` table with a UUID `id` and `clerk_user_id` text column:

```sql
CREATE POLICY "Users can access via profile"
ON user_data
FOR SELECT
TO authenticated
USING (user_id IN (
  SELECT id FROM user_profiles
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));
```

### Pattern: Organization-Based Access

```sql
CREATE POLICY "Org members can access org data"
ON org_data
FOR SELECT
TO authenticated
USING (
  org_id = (select auth.jwt()->'o'->>'id')
);
```

### Pattern: Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public read access"
ON posts
FOR SELECT
TO anon, authenticated
USING (published = true);

-- Only author can write
CREATE POLICY "Authors can update own posts"
ON posts
FOR UPDATE
TO authenticated
USING ((select auth.jwt()->>'sub') = author_clerk_id)
WITH CHECK ((select auth.jwt()->>'sub') = author_clerk_id);
```

## Output Format

When generating policies:

1. Provide a brief explanation of what the policy accomplishes
2. Output valid SQL wrapped in ```sql code blocks
3. Include index creation statements when applicable
4. Never use inline SQL comments for explanations

## Validation Checklist

Before finalizing policies, verify:

- [ ] Each operation (SELECT/INSERT/UPDATE/DELETE) has its own policy
- [ ] `TO authenticated` or `TO anon` is specified explicitly
- [ ] `auth.jwt()` calls are wrapped in `(select ...)`
- [ ] Indexes exist on columns used in policy conditions
- [ ] No `FOR ALL` policies exist
- [ ] SELECT uses only `USING`, INSERT uses only `WITH CHECK`
- [ ] UPDATE has both `USING` and `WITH CHECK`
- [ ] DELETE uses only `USING`

## Discouraged Practices

**Avoid RESTRICTIVE policies** unless absolutely necessary. RESTRICTIVE policies must ALL pass for access to be granted, which can cause unexpected access denials. PERMISSIVE policies (the default) allow access if ANY policy passes, which is more intuitive and easier to debug.

```sql
-- DISCOURAGED: Restrictive policy
CREATE POLICY "Restrict to verified" ON users
AS RESTRICTIVE  -- Avoid this
FOR SELECT TO authenticated
USING (email_verified = true);

-- PREFERRED: Combine conditions in permissive policy
CREATE POLICY "Verified users can view" ON users
FOR SELECT TO authenticated
USING (
  (select auth.jwt()->>'sub') = clerk_user_id
  AND email_verified = true
);
```
