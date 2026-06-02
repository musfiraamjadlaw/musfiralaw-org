## Rename to Untangle

Replace every user-visible "Notebook" string with "Untangle". Scope is presentation + the AI system prompt; no schema, routes, or behavior change.

### Files to edit

1. **`src/routes/login.tsx`**
   - Page title: `"Sign in — Notebook"` → `"Sign in — Untangle"`
   - `<h1>` heading: `Notebook` → `Untangle`

2. **`src/routes/_authenticated/*.tsx`** — update `head().meta` title suffix `— Notebook` → `— Untangle` in:
   - `vault.tsx`, `dump.tsx`, `meaning.tsx`, `clock.tsx`, `editorial.tsx`, `courtroom.tsx`, `start.tsx`

3. **`src/routes/__root.tsx`**
   - Sitewide title `"Cognitive OS"` → `"Untangle"` (so unmatched routes / fallback show the brand)

4. **`src/lib/ai.functions.ts`**
   - System prompt opener: `"the reasoning engine inside Notebook"` → `"the reasoning engine inside Untangle"`

### Not in scope

- Email domain setup — defer until you decide on a domain (your own subdomain vs. buying one). No code change needed for the rename.
- `package.json` `"name"` field stays as-is (internal only, not user-visible).
- The existing `/untangle` route already exists as the core workflow — no routing changes.
