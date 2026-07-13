# Phase 1 architecture decisions

## ADR-001 — The committed OpenAPI is the contract source

The user-supplied `docs/api/openapi.json` (171 paths / 220 operations / 185 schemas) overrides the smaller deployed snapshot. Generated code is reproducible through `npm run api:generate`; `npm run api:check` is the CI stale-generation guard.

## ADR-002 — Keep generated types passive

No generated file is hand-edited. Fetch adapters, query serialization, cursor helpers, mutation IDs and download inspection live under `src/lib/api`.

## ADR-003 — Server state remains in TanStack Query

Entitlements, billing, applications, profile versions, documents and readiness are queried directly. Zustand remains auth-only. Mutation success invalidates the smallest stable domain roots needed by downstream views.

## ADR-004 — Entitlements never derive from plan labels

`EntitlementProvider` is the only premium-access source. Plan name/label is presentation data. Token purchases supplement the allowance and do not create a second plan.

## ADR-005 — Cursor pagination uses explicit loading

Applications, billing usage and references pass opaque cursors untouched and offer “Load more.” Page numbers are not simulated.

## ADR-006 — Optimism is limited to reliable rollback

Only board stage moves are optimistic because the prior board snapshot is complete. Bulk actions, readiness submission, profile restore/import and document links wait for the server, then invalidate. Conflicts surface through a reusable 409 notice.

## ADR-007 — Native controls over new dependencies

Ponytail full mode led to native dialogs/forms, semantic tables, `<details>`, `<progress>`, URLSearchParams and HTML drag events with keyboard move buttons. No third-party drag-and-drop, billing, modal or pagination dependency was added.

## ADR-008 — Keep the Academic Compass visual identity

UI-UX Pro Max suggested a generic dark/green operations palette. That conflicts with the committed EliteApply product register, so Phase 1 retains Source Serif/DM Sans, cool white, cobalt and restrained academic surfaces. Its accessibility and responsive recommendations were adopted.

## ADR-009 — Downloads are inspected at runtime

Weakly typed download endpoints use a single helper that validates protocols and inspects headers/payloads before navigating or saving. Raw tokens, storage keys and provider errors are not rendered.

## ADR-010 — Submission override stays hidden

The contract permits `override_incomplete_requirements`, but product policy is absent. The frontend rechecks readiness immediately before submit, blocks on non-ready state and sends `false`.

# Phase 3 architecture decisions

## ADR-011 — Public workflow secrets remain memory-only

Reference codes are sent only through `X-Reference-Code`; token and code values never enter query strings, persistent storage, analytics properties or rendered receipts. Notification and calendar bearer values receive the same treatment.

## ADR-012 — Interview progression is server-owned

The client renders `current_question` and submits only `mutation_id` plus the answer. It does not echo or choose a question, calculate progression, or synthesize a report.

## ADR-013 — Voice remains a recoverable recorded turn

Native `MediaRecorder`, schema-enumerated MIME types, signed upload and bounded polling cover the contract without a recording dependency. Failed uploads retain the local blob for retry; successful transcription invalidates the session and turns.

## ADR-014 — Notification navigation is allowlisted

Open notification data cannot navigate arbitrarily. `safeNotificationPath` resolves only same-origin paths under an explicit authenticated-route allowlist.

## ADR-015 — Operational UI exposes lifecycle metadata, not content

The admin console is gated by the session `is_admin` claim for discoverability and still relies on backend 403 authorization. Operation and reference-event views omit content, payload, token, code and raw-text keys.
