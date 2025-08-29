# Dynamic Agent Context Injection (Runtime Update Prompt)

This document outlines how to inject contextual knowledge (from user-only audio recordings or other artifacts) into the live Voice Agent at runtime using Deepgram’s Update Prompt capability, and the minimal UX to let users pick what to inject.

Assumptions:
- Step 1 (user-only audio recording → `.wav`) is already working and saved under `public/recordings/`.
- Step 2 (processing `.wav` in Knowledge tab → transcript JSON in `knowledge/`) is already working via `POST /api/speech-to-text` and `POST /api/save-transcript`.


## Overview
- Goal: Let users dynamically select one or more knowledge items (e.g., transcripts) and inject a concise context into the running Voice Agent so it adapts immediately.
- Mechanism: Send a runtime prompt update message over the existing WebSocket to the Voice Agent.
- UX: A dropdown (or multi-select) listing items from `/knowledge`, plus an “Inject” action.


## Runtime Injection Flow
- Source: Any transcript saved under `knowledge/*.json` (output of Step 2) or later summaries derived from them.
- Transform: Collapse transcript to a short context payload:
  - bullets: 3–6 bullet points with key takeaways.
  - quotes: 1–3 key quotes (optional).
  - meta: minimal metadata (id, mode, endedAt, phase) for traceability.
- Transport: Send a Prompt Update message over the Voice Agent socket.
  - In this codebase, we already support this via `injectContext` in `app/context/WebSocketContext.tsx`.
    - See `app/context/WebSocketContext.tsx:520` for `injectContext(...)` that builds a `systemPrompt` and sends `{ type: "Prompt", system }`.
    - The agent acknowledges with `PromptUpdated` messages (handled in the same file).
  - Note: Deepgram’s docs name this “UpdatePrompt”. Message schemas differ slightly by version. If your backend expects `{ type: "UpdatePrompt", ... }`, adapt the `type` while keeping the same `system` content template.


## What’s Already Implemented
- WebSocket wiring and injection helper:
  - `app/context/WebSocketContext.tsx:520` `injectContext(summary, meta)` builds a concise `systemPrompt` and sends it over the open socket.
  - Incoming `PromptUpdated` is logged and indicates success.
- Knowledge creation:
  - `app/api/speech-to-text/route.ts` generates transcript data from `.wav`.
  - `app/api/save-transcript/route.ts` persists JSON files to `knowledge/`.
- Knowledge UI:
  - `app/components/KnowledgeBase.tsx` supports:
    - Uploading audio (and other formats)
    - STT processing → transcript JSON
    - Analyzing transcripts (persona summary)
    - Injecting transcript as context via `injectTranscriptAsContext(...)` (simple summary heuristics)

This means the dynamic prompt update is already possible end-to-end. The remaining work is UX polish: a consistent dropdown (or list) of `knowledge/` items accessible across the app.


## Proposed UX
- Add a small “Context” control next to the Agent controls (or Right Sidebar):
  - Dropdown (single-select) or list (multi-select) populated from `/knowledge`.
  - Preview panel: shows short snippet (first N chars) and metadata.
  - “Inject Context” button: uses `useWebSocketContext().injectContext()` with a generated summary.

Suggested placement:
- Right Sidebar: consistent with knowledge workflows and persona analysis.
- Alternatively, a lightweight inline control in `AgentControls` to keep the action close to “Start session”.


## Backend: List Knowledge Endpoint (optional but recommended)
Implement a small endpoint to enumerate `knowledge/` and return minimal metadata + snippet. Example:

- `GET /api/knowledge/list`
  - Response: `[{ id, filename, createdAt, size, title?, snippet? }]`
  - `id` can be the file stem; `title` may be derived from JSON metadata when present.

Minimal implementation sketch:
- Read `knowledge/` directory
- For each `*.json`, read file, extract `transcript` (or a subset), return snippet


## Frontend: Dropdown + Inject Action
- Create a `ContextInjector` component:
  - Loads `/api/knowledge/list` on mount
  - Renders a select + inject button
  - On inject: fetches the chosen file’s contents, builds a concise summary, calls `injectContext(summary, meta)`
- Reuse the summary heuristic in `KnowledgeBase.tsx` (`injectTranscriptAsContext`) to keep consistent behavior.

Wiring sketch:
- `app/components/ContextInjector.tsx` (new):
  - `const { injectContext } = useWebSocketContext()`
  - `useEffect(() => fetch('/api/knowledge/list'))`
  - `onInject` → `GET /api/knowledge/:id` or just re-fetch the file content, derive bullets/quotes, call `injectContext`.


## Data Contract for Knowledge Items
Expected persisted JSON (already produced by Step 2):
- `filename`: original audio file name
- `uploadDate`, `processedDate`
- `transcript`: string
- `confidence`: number
- `metadata`: object with `duration`, `channels`, `model`, and optionally `utterances`, `words`, `analysis`

Example files available in repo:
- `knowledge/vistage_20250828_212737.json`
- `knowledge/user_recording_*.json`


## System Prompt Template
We keep the injection template centralized in `injectContext` to ensure consistent tone and instructions. Current template (shortened):
- Context header with mode/date/phase
- "Resumen" section (bullets)
- "Citas clave" section (quotes)
- Guidance: do not repeat verbatim; use sparingly for better follow-ups

Adaptations:
- Append phase/industry prompts built by `buildSystemPrompt(...)` if desired
- Trim for length to avoid oversized prompts


## Pseudocode (End-to-End)
- User finishes a recording (Step 1) → `.wav` saved to `public/recordings/`
- In Knowledge tab (Step 2), user runs STT → JSON saved to `knowledge/`
- In any session, open Context dropdown → select an item → click Inject
  - Frontend loads the JSON
  - Build bullets/quotes (3–6 bullets, 1–3 quotes)
  - `useWebSocketContext().injectContext(summary, meta)`
  - Agent logs `PromptUpdated` and immediately uses new context


## Edge Cases & Guardrails
- Socket not open: `injectContext` already checks `WebSocket.OPEN` and warns if closed.
- Oversized prompt: enforce max characters (e.g., 2–3k) by trimming bullets/quotes.
- Multiple injections: last write wins; consider appending a divider and time in template.
- Privacy: exclude sensitive text unless the user confirms.


## Future Enhancements
- Multi-select injection: merge multiple knowledge items into one concise context.
- Auto-summarization: call `/api/analyze-transcript` first to create tighter bullets.
- Pin context: show the last N injected contexts in the UI with quick re-inject.
- Phase-aware merges: combine phase prompt (`PromptEditor`) with injected knowledge.


## References in Code
- WebSocket runtime injection helper: `app/context/WebSocketContext.tsx:520`
- Knowledge tab with working STT → save: `app/components/KnowledgeBase.tsx`
- STT (Deepgram) endpoint: `app/api/speech-to-text/route.ts`
- Save transcript endpoint: `app/api/save-transcript/route.ts`

