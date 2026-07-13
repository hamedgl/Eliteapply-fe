# Phase 3 start review

Date: 2026-07-14  
Branch: `main`  
Starting commit: `1867726`

## Stack and contract

- React 19 + TypeScript + Vite, React Router data router.
- TanStack Query owns server state; Zustand remains limited to the in-memory session.
- Central fetch transport: `src/lib/api/client.ts`.
- Forms use native controlled/uncontrolled React forms; React Hook Form remains installed for established surfaces.
- Vitest + Testing Library and Playwright with system Chromium.
- OpenAPI source: `docs/api/openapi.json`.
- Generated types: `src/generated/api/schema.ts`; adapters stay under `src/lib/api`.
- Corrected contract count: 171 paths, 220 operations and 185 schemas.
- A fresh `openapi-typescript` output in `/tmp` was byte-identical to the committed generated schema before Phase 3 work.

## Prior-phase validation

The Phase 1 and Phase 2 reports were checked against routes, typed adapters, generated types, current tests and the corrected OpenAPI. The Phase 2 contract counts and its Phase 3 risk handoff were accurate. Existing partial reference, interview and admin routes were present, but notifications and reminders had no user-facing surface.

## Existing Phase 3 surfaces and reuse

- `ReferencePages.tsx`: cursor/status list, partial create form, revoke, public referee code entry and verification. Missing detail/edit/events/downloads/lifecycle completeness and public submission fields.
- `InterviewPage.tsx`: one local session without history/resume/report/audio and incorrectly echoed the displayed question in answer requests.
- `AdminLaunchPage.tsx`: launch readiness and gates only.
- `AppShell.tsx`: established responsive Academic Compass navigation with no unread badge or reminder links.
- Existing reusable foundations: refresh-once transport, correlation IDs, defensive downloads, query invalidation, cursor pages, safe public routes, route error boundary, analytics property scrubber and the Source Serif/DM Sans cobalt design system.

## Current coverage and mocks

- Reference create/list/revoke/referee/verify adapters existed; later lifecycle endpoints did not.
- Interview create/answer existed; durable list/detail/turn/report/audio lifecycle did not.
- Notifications, preferences, reminders, calendar feed and most admin operations had no adapters.
- `src/tests/phase3.test.ts` covered content adapters and reference-code header secrecy.
- `e2e/phase3.spec.ts` covered the Writing Studio and the public referee code flow.

## Invalidated assumptions and required migrations

- Interview questions are server-owned. The frontend must never submit its own `question` value.
- Voice is recorded asynchronous transcription with signed upload; no realtime transport or TTS exists.
- Reference creation no longer exposes an invitation token and supports three explicit modes.
- Academic reference detail uses `expected_version` for edits and distinguishes cancellation from revocation.
- Notification data is open-ended and cannot be trusted as a navigation target.
- Reminder recurrence is limited to the schema enum and must use the user profile timezone.
- Admin operation detail deliberately excludes user application content.

## Accessibility, responsive and security implications

- Referee and authenticated application-data routes require `noindex`.
- Reference codes, public tokens, calendar URLs and recorded content must stay out of analytics and logs.
- Recording needs permission denial, unsupported-browser and text-fallback states.
- Cursor lists require explicit load-more, empty and error-safe behavior at mobile widths.
- Destructive and operational actions require confirmation; backend authorization remains authoritative.

## Implementation sequence used

1. Regenerate and compare types; inventory Phase 3 schemas and endpoint parameters.
2. Expand typed adapters and stable query keys.
3. Complete reference list/create/detail/public/verification workflows.
4. Replace local interview state with durable list/detail/turn/report/audio workflows.
5. Add notifications, preferences, unread badge, safe deep links, reminders and calendar feed controls.
6. Expand the admin console with flags, operations, redrive, user support, moderation and audit events.
7. Add noindex, analytics redaction, responsive styling and recovery states.
8. Add unit/contract and Playwright coverage; run Impeccable technical audit.
9. Update architecture, gap, reuse and completion documentation.
