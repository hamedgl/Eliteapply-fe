# Unused OpenAPI endpoints baseline

Date: 2026-07-14

## Scope

This baseline follows the supplied endpoint-consumer model and completes only Phase 1 in this change. Per the later scope instruction, infrastructure and monitoring operations (`GET /health`, `GET /ready`, `GET /metrics`, and deprecated `GET /metric`) are excluded from this effort.

OpenAPI types were regenerated from `docs/api/openapi.json` before the audit. The generated schema did not change.

## Current state

| Operation                                                | Current state                                                                                                                              | Intended consumer              | Phase 1 action                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/applications/{application_id}/requirements` | Generated and documented, but no frontend GET function or query uses it. Requirement mutations exist and only refresh the workspace query. | Direct SPA resource panel      | Add a typed client function/hook, dedicated cache key, cache seeding, independent retry/refresh, and a deep link. |
| `GET /api/v1/applications/{application_id}/tasks`        | Generated and documented, but no frontend GET function or query uses it. Task mutations exist and only refresh the workspace query.        | Direct SPA resource panel      | Add a typed client function/hook, dedicated cache key, cache seeding, independent retry/refresh, and a deep link. |
| `GET /api/v1/calendar-feed/{token}.ics`                  | Token create/revoke UI exists, but the external feed URL is not fetched by React.                                                          | External calendar client       | Deferred; no Phase 1 change.                                                                                      |
| `GET /api/v1/storage/file?token=...`                     | Signed download URLs are consumed by browser navigation; the local endpoint is not called directly.                                        | Signed-URL browser transport   | Deferred; no Phase 1 change.                                                                                      |
| `PUT /api/v1/storage/upload?token=...`                   | Document and interview helpers transfer to server-returned signed URLs, with duplicated transport logic.                                   | Signed-URL browser transport   | Deferred; no Phase 1 change.                                                                                      |
| `GET /health`                                            | No React consumer, smoke script, or CI workflow exists in this repository.                                                                 | Deployment check               | Excluded by user instruction.                                                                                     |
| `GET /ready`                                             | No React consumer, smoke script, or CI workflow exists in this repository.                                                                 | Deployment check               | Excluded by user instruction.                                                                                     |
| `GET /metrics`                                           | No React consumer or Prometheus configuration exists in this repository.                                                                   | External monitoring            | Excluded by user instruction.                                                                                     |
| `GET /metric`                                            | Deprecated alias is not used.                                                                                                              | Deprecated external monitoring | Excluded by user instruction; remain unused.                                                                      |

## Existing application behavior

- `/app/applications/:id` fetches the composite workspace and renders overview, requirements, tasks, documents, eligibility, collaborators, and activity from that response.
- Requirements and tasks are local tab state, so neither panel has a durable URL.
- The composite response is not copied into granular React Query caches.
- Requirement and task mutations invalidate only the workspace query. Readiness, dashboard, history, and future granular caches can therefore diverge.
- Requirement UI already supports add, bulk add, validation, completion, pointer reordering, and keyboard move controls. It lacks independent loading/retry/refresh, progress, edit/delete controls, and linked-document evidence.
- Task UI already supports add, bulk add, completion, pointer reordering, and keyboard move controls. It lacks independent loading/retry/refresh, edit/delete controls, and due-state grouping.
- Query defaults use a 30-second stale time. Phase 1 will give seeded resource caches an explicit freshness window so opening a seeded panel does not immediately issue a list request.

## Repository audit

- API types: `docs/api/openapi.json`, `src/generated/api/schema.ts`
- API client: `src/lib/api/client.ts`, `src/lib/api/phase2.ts`
- Query cache: `src/lib/api/queryKeys.ts`, `src/app/PrivateRoot.tsx`
- Workspace and mutations: `src/features/applications/ApplicationWorkspace.tsx`
- Routes: `src/app/App.tsx`
- Tests: `src/tests`, `e2e/phase1-delta.spec.ts`, `e2e/phase2.spec.ts`
- Calendar token UI: `src/features/reminders/RemindersPage.tsx`
- Upload/download utilities: `src/lib/api/download.ts`, `src/lib/api/phase2.ts`, `src/lib/api/phase3.ts`
- API coverage: `docs/implementation/api-coverage.md`; no executable endpoint-coverage script or usage manifest currently exists.
- CI: no repository-owned workflow files were found.

## Expected Phase 1 files

- `src/lib/api/phase2.ts`
- `src/lib/api/queryKeys.ts`
- `src/features/applications/applicationQueries.ts`
- `src/features/applications/ApplicationWorkspace.tsx`
- `src/app/App.tsx`
- focused unit and E2E tests
- this baseline and the Phase 1 report

## Changed assumptions

1. The workspace remains the normal first request; the dedicated GETs are recovery and direct-resource paths, not parallel bootstrap calls.
2. URL-addressable requirements/tasks views may use the existing application workspace shell while skipping the composite workspace request on a direct load.
3. A workspace response is authoritative enough to seed application, requirement, task, and document-link caches for a short freshness window.
4. The API exposes no partial workspace envelope. Partial-failure recovery therefore means the workspace error state must link to independently loadable resource views.
5. No optimistic requirement/task mutation will be added unless it includes snapshots and rollback. Existing server-first mutations will remain server-first.
6. Infrastructure and monitoring endpoints are out of scope by explicit user instruction.
