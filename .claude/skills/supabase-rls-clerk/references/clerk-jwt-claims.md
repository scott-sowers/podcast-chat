# Clerk Session Token Claims Reference

This reference documents the JWT claims available in Clerk session tokens when using Supabase Third-Party Auth integration.

## Accessing Claims in RLS Policies

Use `auth.jwt()` to access the full JWT, then extract claims:

```sql
-- Get a top-level claim
auth.jwt()->>'claim_name'

-- Get a nested claim
auth.jwt()->'parent'->>'child'

-- Get as specific type
(auth.jwt()->>'exp')::integer
```

## Default Claims (Version 2)

These claims are always present in Clerk session tokens:

| Claim | Key | Type | Description | Example |
|-------|-----|------|-------------|---------|
| Subject (User ID) | `sub` | text | The Clerk user ID | `user_2NNEqL2nrIRdJ194ndJq` |
| Authorized Party | `azp` | text | Origin URL of the request | `https://example.com` |
| Expiration | `exp` | integer | Unix timestamp when token expires | `1713158400` |
| Issued At | `iat` | integer | Unix timestamp when token was issued | `1713158000` |
| Not Before | `nbf` | integer | Unix timestamp before which token is invalid | `1713158000` |
| Issuer | `iss` | text | Frontend API URL | `https://clerk.your-site.com` |
| JWT ID | `jti` | text | Unique token identifier | `sess_abc123` |
| Session ID | `sid` | text | Current session ID | `sess_2abc123` |
| Version | `v` | integer | Session token version | `2` |
| Factor Verification Age | `fva` | array | Minutes since 1st/2nd factor verification | `[7, -1]` |
| Session Status | `sts` | text | Current session status | `active` |

## Organization Claims (`o` object)

Present only when user has an active organization:

| Claim | Access Pattern | Type | Description | Example |
|-------|----------------|------|-------------|---------|
| Org ID | `auth.jwt()->'o'->>'id'` | text | Organization ID | `org_2abc123` |
| Org Slug | `auth.jwt()->'o'->>'slg'` | text | Organization slug | `my-company` |
| Org Role | `auth.jwt()->'o'->>'rol'` | text | User's role (without `org:` prefix) | `admin` |
| Permissions | `auth.jwt()->'o'->>'per'` | text | Comma-separated permissions | `read,manage` |

## Plan and Features Claims

| Claim | Access Pattern | Type | Description | Example |
|-------|----------------|------|-------------|---------|
| Plan | `auth.jwt()->>'pla'` | text | Active plan (scope:slug) | `u:free`, `o:pro` |
| Features | `auth.jwt()->>'fea'` | text | Enabled features | `o:dashboard,o:api` |

## Actor Claim (Impersonation)

Present only during user impersonation:

| Claim | Access Pattern | Type | Description |
|-------|----------------|------|-------------|
| Actor Issuer | `auth.jwt()->'act'->>'iss'` | text | Referrer URL |
| Actor Session | `auth.jwt()->'act'->>'sid'` | text | Impersonated session ID |
| Actor Subject | `auth.jwt()->'act'->>'sub'` | text | Impersonator's user ID |

## Common RLS Patterns with Claims

### Match User ID

```sql
USING ((select auth.jwt()->>'sub') = clerk_user_id)
```

### Check Organization Membership

```sql
USING ((select auth.jwt()->'o'->>'id') = org_id)
```

### Check Organization Role

```sql
USING (
  (select auth.jwt()->'o'->>'id') = org_id
  AND (select auth.jwt()->'o'->>'rol') = 'admin'
)
```

### Check MFA Completion

The `fva` claim is an array where:
- Index 0: Minutes since first factor (password/OAuth)
- Index 1: Minutes since second factor (-1 if never verified)

```sql
-- Require MFA completed
USING ((select auth.jwt()->'fva'->>1) != '-1')

-- Require recent MFA (within 10 minutes)
USING ((select (auth.jwt()->'fva'->>1)::integer) BETWEEN 0 AND 10)
```

### Check Session Status

```sql
USING ((select auth.jwt()->>'sts') = 'active')
```

## Important Notes

1. **Claims are compact**: Clerk intentionally uses short keys to keep JWT size small
2. **Organization claims optional**: The `o` object only exists when an organization is active
3. **Wrap in (select ...)**: Always wrap `auth.jwt()` calls for performance
4. **Text comparison**: Most claims return text; cast when comparing to other types
5. **Version 2 tokens**: This documents v2 tokens (check `auth.jwt()->>'v'` = '2')

## Full Access Example

```sql
-- Get all claims for debugging (use in SQL editor, not RLS)
SELECT auth.jwt();

-- Check specific claim exists
SELECT auth.jwt() ? 'o';  -- Has organization

-- Get organization if present
SELECT COALESCE(auth.jwt()->'o'->>'id', 'no-org');
```
