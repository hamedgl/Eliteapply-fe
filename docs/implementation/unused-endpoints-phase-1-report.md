# Unused endpoints Phase 1 report

Date: 2026-07-14

## Outcome

Phase 1 directly integrates the dedicated requirements and tasks operations without adding them to the normal workspace bootstrap:

- `GET /api/v1/applications/{application_id}/requirements`
- `GET /api/v1/applications/{application_id}/tasks`

Requirements and Tasks now have durable resource routes, independently recover from a failed workspace request, and can be refreshed without reloading unrelated workspace data.

Infrastructure and monitoring endpoints were intentionally skipped by later user instruction. No `/health`, `/ready`, `/metrics`, or deprecated `/metric` consumer was added.

## Files changed

### Product and data flow

- `src/app/App.tsx` — added the URL-addressable application resource route.
- `src/features/applications/ApplicationWorkspace.tsx` — added resource routing, independent states, refresh, progress/grouping, linked-document counts, edit/delete actions, cache synchronization, and visible recovery/conflict handling.
- `src/features/applications/applicationQueries.ts` — added typed fetch functions, hooks, cache seeding, freshness, and shared invalidation.
- `src/lib/api/phase2.ts` — added cancellable requirements/tasks GET methods and signal support for application/workspace GETs.
- `src/lib/api/queryKeys.ts` — added application, requirements, tasks, readiness, and history keys.
- `src/styles/index.css` — aligned resource controls with the existing design system and added responsive action wrapping.

### Focused UI consistency requested during the phase

- `src/features/profile/AcademicProfilePage.tsx` — reused shared secondary/danger button variants for Import and Delete.
- `src/features/reminders/RemindersPage.tsx` — reused primary/secondary/danger variants for Create, Copy, and Revoke calendar-feed actions.

### Tests and documentation

- `src/tests/application-resources.test.tsx`
- `e2e/unused-endpoints-phase1.spec.ts`
- `e2e/academic-profile.spec.ts`
- `e2e/phase3.spec.ts`
- `docs/implementation/unused-endpoints-baseline.md`
- `docs/implementation/api-coverage.md`
- `docs/implementation/unused-endpoints-phase-1-report.md`

The generated schema was regenerated from `docs/api/openapi.json`; it had no diff.

## Request-count comparison

| Flow | Before | After |
| --- | --- | --- |
| Normal application workspace load | 1 logical workspace GET; no granular GETs | 1 logical workspace GET; 0 requirements GETs; 0 tasks GETs |
| Open Requirements/Tasks after workspace load | Local tab only | Seeded cache; 0 granular GETs while fresh |
| Manual Requirements refresh | Not available | 1 requirements GET; 0 tasks GETs; no workspace refetch |
| Direct Tasks deep link | Not available | 1 logical tasks GET; 0 workspace GETs; 0 requirements GETs |
| Workspace failure then Requirements recovery | No independent recovery | Failed workspace GET followed by 1 requirements GET |

The E2E suite verifies the important invariant: normal loading never starts workspace, requirements, and tasks as three parallel requests. Development Strict Mode may cancel and restart a logical request; tests therefore assert operation isolation rather than treating a development abort/restart as product traffic.

## Query and mutation decisions

- Dedicated keys are `applicationKeys` equivalents under the existing `queryKeys` object: `requirements(applicationId)` and `tasks(applicationId)`.
- The workspace success path seeds application, requirements, tasks, and document-link caches.
- Seeded resource data remains fresh for 60 seconds, preventing an immediate granular refetch when the user enters either panel.
- Direct resource routes skip the composite workspace request and enable only their dedicated query.
- Workspace failure presents durable Requirements and Tasks recovery links instead of converting the failure into empty arrays.
- Requirement mutations invalidate workspace, dedicated requirements, readiness, dashboard, and application history.
- Task mutations invalidate workspace, dedicated tasks, dashboard, and application history.
- Mutations remain server-first. No optimistic state was added because the required snapshot, rollback, reconciliation, and conflict workflow would add risk without improving the current interaction materially.
- API conflicts remain visible, retain user context, and provide a refresh action.

## UI delivered

Requirements include loading, empty, retry, manual refresh, completion progress, workflow and validation state, linked-document counts, pointer drag ordering, keyboard move controls, bulk add, edit, validate, complete/reopen, and delete.

Tasks include loading, empty, retry, manual refresh, overdue/upcoming/unscheduled/completed summaries, pointer drag ordering, keyboard move controls, bulk add, edit, complete/reopen, and delete.

Desktop and 390 px mobile browser captures were reviewed. Resource actions use the shared button vocabulary and wrap below content on narrow screens.

## Tests and quality gates

| Gate | Result |
| --- | --- |
| `npm run api:check` | Passed; generated client current |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed (repository script currently runs the TypeScript build) |
| `npm test` | Passed: 7 files, 29 tests |
| Focused Playwright regression | Passed: 13 tests |
| `npm run build` | Passed: production Vite build |
| `git diff --check` | Passed |

Focused coverage includes client paths and cancellation, hooks, cache seeding, invalidation, deep links, request isolation, partial-failure recovery, manual refresh, desktop/mobile rendering, and the requested shared button variants. The Browser plugin was not available in this environment, so repository Playwright was used for rendered interaction and screenshot verification.

## Discovered contract differences

1. `ApplicationWorkspaceResponse` has no partial-success envelope. Independent recovery must begin from the workspace error state and load a dedicated resource route.
2. Requirement list responses contain requirement records, not linked document objects. Linked counts come from the existing document-link cache, seeded by the workspace or loaded through the existing documents operation.
3. Task `status` is generated as an open string rather than a closed enum. Schedule groups are derived defensively from status and `due_at`.
4. Requirement/task delete operations do not accept an `expected_version` body. Deletes remain confirmed, server-first operations; any server conflict is surfaced rather than hidden.
5. A direct resource route does not fetch application metadata merely to decorate the heading. It uses cached metadata when available and a truthful resource heading otherwise, preserving the one-resource request model.

## Changed assumptions and prompt deviations

- The prompt's route option was adopted as `/app/applications/:applicationId/requirements` and `/tasks` using the repository's `:id` naming convention.
- “Partial workspace failure” is implemented as recovery after a failed composite request because the backend does not return per-resource partial errors.
- Optimistic writes were deliberately not introduced; safe server-first reconciliation satisfies consistency with less state machinery.
- The user's later instruction removed infrastructure and monitoring APIs from scope. They remain intentionally untouched.
- The two button-consistency fixes were included as an explicit user-requested UI correction, not as endpoint-coverage work.

## Next-phase heads-up

Phase 2 should retain the real-consumer model: the calendar `.ics` URL belongs to external calendar clients, while storage upload/download paths belong behind one provider-neutral signed-URL transport. The audit found duplicated signed-transfer logic in the current phase-specific API modules; that is the highest-value consolidation target. Do not add direct JSON-client fetches for the ICS or signed storage endpoints. Infrastructure and monitoring endpoints remain excluded unless the user reopens that scope.
