# RLS Policy Patterns for Clerk Third-Party Auth

This reference provides copy-paste patterns for common RLS scenarios with Clerk authentication.

## Pattern 1: Direct User Ownership

Use when rows have a direct `clerk_user_id` column.

### Schema

```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_notes_clerk_user_id ON user_notes(clerk_user_id);
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
```

### Policies

```sql
CREATE POLICY "Users can view own notes"
ON user_notes FOR SELECT TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id);

CREATE POLICY "Users can create notes"
ON user_notes FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

CREATE POLICY "Users can update own notes"
ON user_notes FOR UPDATE TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id)
WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

CREATE POLICY "Users can delete own notes"
ON user_notes FOR DELETE TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id);
```

## Pattern 2: User Profile Junction

Use when a `user_profiles` table links Clerk user IDs to internal UUIDs.

### Schema

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
```

### Policies for user_profiles

```sql
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT TO authenticated
USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE TO authenticated
USING (clerk_user_id = (select auth.jwt()->>'sub'))
WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY "Users can create own profile"
ON user_profiles FOR INSERT TO authenticated
WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));
```

### Policies for user_projects (via junction)

```sql
CREATE POLICY "Users can view own projects"
ON user_projects FOR SELECT TO authenticated
USING (user_id IN (
  SELECT id FROM user_profiles
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));

CREATE POLICY "Users can create projects"
ON user_projects FOR INSERT TO authenticated
WITH CHECK (user_id IN (
  SELECT id FROM user_profiles
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));

CREATE POLICY "Users can update own projects"
ON user_projects FOR UPDATE TO authenticated
USING (user_id IN (
  SELECT id FROM user_profiles
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
))
WITH CHECK (user_id IN (
  SELECT id FROM user_profiles
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));

CREATE POLICY "Users can delete own projects"
ON user_projects FOR DELETE TO authenticated
USING (user_id IN (
  SELECT id FROM user_profiles
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));
```

## Pattern 3: Team/Organization Membership

Use when access is based on team/org membership.

### Schema

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE(team_id, clerk_user_id)
);

CREATE TABLE team_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_members_clerk_user_id ON team_members(clerk_user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_documents_team_id ON team_documents(team_id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_documents ENABLE ROW LEVEL SECURITY;
```

### Policies for teams

```sql
CREATE POLICY "Members can view their teams"
ON teams FOR SELECT TO authenticated
USING (id IN (
  SELECT team_id FROM team_members
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));

CREATE POLICY "Owners can update teams"
ON teams FOR UPDATE TO authenticated
USING (id IN (
  SELECT team_id FROM team_members
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
  AND role = 'owner'
));
```

### Policies for team_members

```sql
CREATE POLICY "Members can view team roster"
ON team_members FOR SELECT TO authenticated
USING (team_id IN (
  SELECT team_id FROM team_members tm
  WHERE tm.clerk_user_id = (select auth.jwt()->>'sub')
));

CREATE POLICY "Admins can add members"
ON team_members FOR INSERT TO authenticated
WITH CHECK (team_id IN (
  SELECT team_id FROM team_members
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
  AND role IN ('owner', 'admin')
));

CREATE POLICY "Admins can remove members"
ON team_members FOR DELETE TO authenticated
USING (team_id IN (
  SELECT team_id FROM team_members
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
  AND role IN ('owner', 'admin')
));
```

### Policies for team_documents

```sql
CREATE POLICY "Members can view team documents"
ON team_documents FOR SELECT TO authenticated
USING (team_id IN (
  SELECT team_id FROM team_members
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));

CREATE POLICY "Members can create documents"
ON team_documents FOR INSERT TO authenticated
WITH CHECK (team_id IN (
  SELECT team_id FROM team_members
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
));

CREATE POLICY "Admins can update documents"
ON team_documents FOR UPDATE TO authenticated
USING (team_id IN (
  SELECT team_id FROM team_members
  WHERE clerk_user_id = (select auth.jwt()->>'sub')
  AND role IN ('owner', 'admin')
));
```

## Pattern 4: Clerk Organizations (via JWT)

Use when using Clerk Organizations and the org ID is in the JWT.

### Schema

```sql
CREATE TABLE org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_settings_clerk_org_id ON org_settings(clerk_org_id);
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;
```

### Policies

```sql
CREATE POLICY "Org members can view settings"
ON org_settings FOR SELECT TO authenticated
USING (clerk_org_id = (select auth.jwt()->'o'->>'id'));

CREATE POLICY "Org admins can update settings"
ON org_settings FOR UPDATE TO authenticated
USING (
  clerk_org_id = (select auth.jwt()->'o'->>'id')
  AND (select auth.jwt()->'o'->>'rol') = 'admin'
)
WITH CHECK (
  clerk_org_id = (select auth.jwt()->'o'->>'id')
  AND (select auth.jwt()->'o'->>'rol') = 'admin'
);
```

## Pattern 5: Public/Private Visibility

Use for content with visibility settings.

### Schema

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_clerk_user_id ON posts(clerk_user_id);
CREATE INDEX idx_posts_is_public ON posts(is_public) WHERE is_public = true;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
```

### Policies

```sql
-- Anyone can view public posts
CREATE POLICY "Public posts are viewable"
ON posts FOR SELECT TO anon, authenticated
USING (is_public = true);

-- Authors can view all their posts (including drafts)
CREATE POLICY "Authors can view own posts"
ON posts FOR SELECT TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id);

-- Only authors can create
CREATE POLICY "Authors can create posts"
ON posts FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

-- Only authors can update
CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id)
WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

-- Only authors can delete
CREATE POLICY "Authors can delete own posts"
ON posts FOR DELETE TO authenticated
USING ((select auth.jwt()->>'sub') = clerk_user_id);
```

## Pattern 6: Global Read-Only Tables

Use for reference data that anyone can read but only service role can modify.

### Schema

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
```

### Policies

```sql
-- Everyone can read
CREATE POLICY "Categories are public"
ON categories FOR SELECT TO anon, authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies = only service role can modify
```

## Pattern 7: Security Definer Functions for Complex Queries

Use to bypass RLS on joined tables and improve performance.

### Helper Function

```sql
CREATE OR REPLACE FUNCTION get_user_team_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT team_id FROM team_members
    WHERE clerk_user_id = (select auth.jwt()->>'sub')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Policy Using Helper

```sql
CREATE POLICY "Members can view team resources"
ON team_resources FOR SELECT TO authenticated
USING (team_id = ANY((select get_user_team_ids())));
```

## Performance Optimization Checklist

1. **Indexes**: Add indexes on all columns used in policy conditions
2. **Select wrapper**: Always use `(select auth.jwt()->>'...')` not `auth.jwt()->>'...'`
3. **Avoid joins to source**: Subqueries should filter on fixed values, not row columns
4. **Security definer**: Use for complex queries to bypass RLS on joined tables
5. **Specify roles**: Always include `TO authenticated` or `TO anon`
6. **Add client filters**: Use `.eq('user_id', userId)` in addition to RLS for better performance
