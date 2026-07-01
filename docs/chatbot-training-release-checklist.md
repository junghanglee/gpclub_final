# Chatbot Training Release & QA Checklist

This checklist is for releasing the GPCLUB chatbot training/admin expansion.

## Scope

- Admin can manage chatbot documents and chunks.
- Admin can manage guided tree scenarios in `chatbot_tree_nodes`.
- Customer chat can choose between:
  - Guided/tree 상담 mode
  - Natural AI 자유채팅 mode
- Both modes use the same approved document/chunk knowledge base.

## Files to verify before release

- `supabase/migrations/20260529192000_chatbot_document_training.sql`
- `src/routes/admin.tsx`
- `src/components/site/GippyChat.tsx`
- `src/lib/chatbot.ts`
- `src/integrations/supabase/types.ts`
- `docs/chatbot-training-architecture.md`

## Pre-release commands

Run from project root:

```bash
npx tsc --noEmit --pretty false
npm run build
```

Both must finish with no errors. Treat Vite chunk-size notices as performance warnings, not release blockers, unless a new route or dependency caused a sudden size increase.

### Local-only QA guardrails

Before any production action, confirm the target environment explicitly:

- Do not run `supabase db push`, deploy commands, or external registration scripts during local QA.
- Do not paste or commit local `.env`, token, or generated secret files.
- If `git status` fails because the local worktree points at a missing external gitdir, record that as an environment blocker and rely on file-level inspection plus build/typecheck results for local QA only.

## Supabase migration application

> Important: Apply to production only after confirming the target Supabase project.

### Option A: Supabase Dashboard SQL Editor

1. Open Supabase project dashboard.
2. Go to SQL Editor.
3. Open local file:
   - `supabase/migrations/20260529192000_chatbot_document_training.sql`
4. Paste the full SQL.
5. Run it once.
6. Confirm no SQL errors.

### Option B: Supabase CLI

Requires Supabase CLI login and linked project.

```bash
supabase db push
```

If the CLI is not linked, link the correct project first. Do not run against an unknown project.

## Database objects expected after migration

Tables:

- `public.chatbot_documents`
- `public.chatbot_document_chunks`
- `public.chatbot_training_jobs`
- `public.chatbot_tree_nodes`

Added columns on `public.chatbot_records`:

- `matched_documents`
- `matched_chunks`
- `confidence`
- `needs_review`
- `chat_ui_mode`
- `selected_tree_path`

Policies to confirm:

- Admins can manage chatbot documents.
- Public can read only active/enabled chatbot documents.
- Admins can manage chatbot chunks.
- Public can read chunks only when the parent document is active/enabled.
- Admins can manage chatbot tree nodes.
- Public can read only enabled tree nodes.

## Admin QA

### 1. Login

- Login with an admin account.
- Open Admin page.
- Open `Chatbot Training` tab.

Expected:

- Page loads with no console errors.
- Document library section is visible.
- Tree scenario section is visible.

### 2. Document registration

Create a test document:

- Title: `QA Test GPCLUB Guide`
- Category: `general`
- Language: `en` or `mixed`
- Source type: `pasted_text`
- Status: `active`
- Enabled: `on`
- Raw content: paste a short GPCLUB test answer.

Expected:

- Save succeeds.
- Document appears in the document library.

### 3. Chunk generation

- Open the saved document.
- Generate/sync chunks.
- Open chunk preview.

Expected:

- At least one chunk is created.
- Chunk content matches the document content.

### 4. Tree scenario registration

Create a root tree node:

- Scenario key: `default`
- Parent ID: empty/root
- Sort order: `1`
- Button label EN: `About GPCLUB`
- Answer EN: `GPCLUB is a global beauty brand platform.`
- Action type: `answer`
- Enabled: `on`

Expected:

- Save succeeds.
- Node appears in the tree scenario table.

Create a child tree node:

- Scenario key: `default`
- Parent ID: root node id
- Sort order: `1`
- Button label EN: `Products`
- Answer EN: `You can ask about our product categories.`
- Action type: `answer`
- Enabled: `on`

Expected:

- Save succeeds.
- Child node appears.

## Customer chat QA

### 1. Open customer site

Open the deployed site or local preview.

Expected:

- Gippy chat button appears.
- Chat panel opens normally.

### 2. Mode selection

Expected:

- User can choose:
  - `Guided 상담`
  - `AI 자유채팅`

### 3. Guided/tree mode

- Choose `Guided 상담`.
- Confirm admin-created root tree buttons appear.
- Click `About GPCLUB`.

Expected:

- The clicked label appears as a user message.
- The configured answer appears as a Gippy message.
- If child nodes exist, next-level buttons appear.
- Back button works on child level.

### 4. Natural AI mode

- Choose `AI 자유채팅`.
- Ask a question covered by the active document.

Expected:

- Answer is based on matched approved document/chunk content.
- If confidence is low, the answer should be cautious and route to manager/contact if needed.

### 5. Record logging

Check `chatbot_records` after test chats.

Expected:

- `chat_ui_mode` records `tree` or `natural`.
- `selected_tree_path` records the clicked guided path.
- `matched_documents` and `matched_chunks` are populated for knowledge-based answers.
- `needs_review` is true for uncertain answers.

## Rollback / disable plan

If customer chat fails after migration:

1. Disable new tree nodes by setting `enabled = false` in `chatbot_tree_nodes`.
2. Disable problematic documents by setting `enabled = false` or `status != 'active'` in `chatbot_documents`.
3. The built-in fallback quick replies still remain in the customer chat UI when no DB tree nodes are visible.

## Known remaining limitations

- No external embedding API is used.
- Search is local text splitting + keyword/text matching.
- Quality depends on the cleanliness of admin-entered documents.
- Production DB migration must be applied before new admin tree/document tables work live.
