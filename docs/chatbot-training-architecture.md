# GPCLUB Gippy AI — Document-Based Chatbot Training Architecture

## 1. Goal

Build a chatbot training system where admins can register multiple documents and Gippy AI answers only within the approved GPCLUB knowledge scope.

The system must support:

- Q&A pairs
- Product facts
- Freeform documents
- Uploaded documents/manuals
- Korean, English, Vietnamese answers
- Safe fallback when no reliable source is found
- Admin review and continuous improvement from chatbot logs

## 2. Current State

Current implementation uses `chatbot_training` rows directly in the prompt:

- `kind = qa | product | doc`
- `title`, `question`, `answer`, `content`, `tags`
- enabled rows are fetched and inserted into the AI prompt

Limitations:

- Too many documents make prompts long and expensive.
- Related and unrelated knowledge are mixed together.
- No chunk-level source citation.
- No scalable semantic search.
- The model may answer from general knowledge if the document scope is weak.

## 3. Target Architecture

Use Retrieval-Augmented Generation (RAG):

1. Admin registers or uploads documents.
2. System extracts text from each document.
3. Text is split into small chunks.
4. Each chunk receives an embedding vector.
5. User asks a question.
6. System searches only relevant chunks.
7. AI answers using only retrieved approved chunks.
8. If no relevant chunk exists, AI says it does not have enough information and directs user to GPCLUB staff.

## 4. Data Model

### 4.1 chatbot_documents

Stores document-level metadata.

Suggested fields:

- `id uuid primary key`
- `title text not null`
- `description text`
- `language text` — `ko | en | vi | mixed`
- `category text` — `brand | product | b2b | policy | faq | event | other`
- `source_type text` — `manual | upload | url | pasted_text`
- `file_url text`
- `status text` — `draft | processing | active | archived | failed`
- `enabled boolean default true`
- `version integer default 1`
- `tags text[] default '{}'`
- `created_by uuid`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### 4.2 chatbot_document_chunks

Stores searchable text chunks.

Suggested fields:

- `id uuid primary key`
- `document_id uuid references chatbot_documents(id) on delete cascade`
- `chunk_index integer not null`
- `content text not null`
- `content_hash text`
- `language text`
- `token_count integer`
- `embedding vector(...)` — if Supabase pgvector is used
- `metadata jsonb default '{}'`
- `created_at timestamptz default now()`

Indexes:

- `document_id`
- vector index on `embedding`
- optional full-text index for keyword fallback

### 4.3 chatbot_training_jobs

Tracks document processing status.

Suggested fields:

- `id uuid primary key`
- `document_id uuid references chatbot_documents(id) on delete cascade`
- `status text` — `queued | running | completed | failed`
- `error_message text`
- `started_at timestamptz`
- `finished_at timestamptz`
- `created_at timestamptz default now()`

### 4.4 chatbot_records enhancement

Existing `chatbot_records` should later store retrieval evidence.

Suggested additional fields:

- `matched_documents jsonb`
- `matched_chunks jsonb`
- `confidence numeric`
- `needs_review boolean default false`

## 5. Admin Workflow

### Step 1 — Register document

Admin opens `Admin > Chatbot Training > Documents` and creates a document:

- title
- category
- language
- tags
- content paste or file upload

### Step 2 — Process document

System automatically:

- extracts text
- normalizes whitespace
- splits text into chunks
- creates embeddings
- marks document as `active`

### Step 3 — Review

Admin can:

- preview chunks
- disable a document
- archive old versions
- edit title/tags/category
- reprocess after content changes

### Step 4 — Use in answers

Only `active + enabled` documents are searchable by the chatbot.

## 6. Chat Answer Flow

### 6.1 User question

User asks a question in Korean, English, or Vietnamese.

### 6.2 Query normalization

System detects language and prepares the search query.

### 6.3 Retrieval

System searches:

1. semantic vector search from `chatbot_document_chunks`
2. keyword fallback from Q&A/product rows if needed

Return top 3-8 chunks only.

### 6.4 Answer generation

AI receives:

- system policy
- user question
- recent conversation history
- retrieved chunks only

System rule:

> Answer only from the provided GPCLUB knowledge. If the answer is not in the sources, say that the information is not available and recommend contacting GPCLUB via Zalo/WhatsApp.

### 6.5 Store record

Save to `chatbot_records`:

- customer question
- chatbot reply
- matched document/chunk IDs
- confidence score
- needs_review flag

## 7. Safety Rules

The chatbot must not invent:

- prices
- contracts
- legal terms
- stock availability
- discount policy
- official distributor claims beyond approved documents
- medical/skin treatment claims

Fallback message example:

> I do not have enough approved GPCLUB information to answer that accurately. Please contact the GPCLUB Vietnam team via Zalo or WhatsApp for confirmation.

Vietnamese:

> Hiện tôi chưa có đủ thông tin đã được GPCLUB phê duyệt để trả lời chính xác. Vui lòng liên hệ đội ngũ GPCLUB Vietnam qua Zalo hoặc WhatsApp để được xác nhận.

Korean:

> 현재 승인된 GPCLUB 자료 안에서는 정확히 답변할 정보가 부족합니다. Zalo 또는 WhatsApp으로 GPCLUB Vietnam 팀에 문의해 주세요.

## 8. Multilingual Strategy

Preferred approach:

- Store original document language.
- Search across all languages.
- Answer in the user's language.
- Do not translate product names or brand names incorrectly.

If search quality is weak:

- Add translated summary fields per chunk later.
- Or create embeddings from multilingual model.

## 9. Implementation Phases

### Phase 1 — Low-risk upgrade

- Keep current `chatbot_training` table.
- Improve answer rules to restrict hallucination.
- Save source rows used in `chatbot_records`.
- Add better admin labels and document categories.

### Phase 2 — Document tables

- Add `chatbot_documents` and `chatbot_document_chunks`.
- Add admin document registration UI.
- Add processing job status.

### Phase 3 — Semantic search

- Enable pgvector or external vector search.
- Generate embeddings for chunks.
- Search top chunks per question.

### Phase 4 — Quality loop

- Add `needs_review` detection.
- Admin can convert weak chatbot records into Q&A/training data.
- Add feedback buttons.

## 10. Recommended Final Design

Use a hybrid model:

- `chatbot_training` remains for short curated Q&A/product facts.
- `chatbot_documents` stores official manuals and long knowledge.
- `chatbot_document_chunks` powers semantic search.
- `chatbot_records` becomes the feedback/review loop.

This gives GPCLUB a scalable chatbot that can learn from many documents without sending all documents to the AI model every time.

## Customer Chat UI modes

The customer-facing chatbot must support two selectable UI modes while sharing one approved knowledge engine.

### 1. Tree guide mode

- Customers choose buttons/options instead of typing freely.
- Best for fast journeys: product recommendation, B2B application, brand information, event/promotion guidance, and human contact handoff.
- Admin-managed items should include scenario key, parent node, sort order, button label, answer text, action type, and optional linked training/document source.
- Tree answers may either show fixed approved copy or call the shared knowledge engine with a constrained query.

### 2. Natural AI chat mode

- Customers type free-form questions and receive natural-language answers.
- Answers must be grounded in approved Q&A, product facts, document chunks, and optionally tree scenario labels.
- If confidence is low or no approved source is found, the bot should ask a clarifying question or hand off to Zalo/WhatsApp instead of inventing details.

### Shared knowledge principle

- The admin should register knowledge once.
- Q&A entries, product facts, long documents, and tree nodes are all source material.
- Conversation records should store `chat_ui_mode`, matched documents/chunks, confidence, needs-review flag, and selected tree path so admins can improve both modes.
