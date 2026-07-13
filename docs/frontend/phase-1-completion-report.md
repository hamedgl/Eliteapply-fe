# Phase 1 completion report

Date: 2026-07-13  
Branch: `main`  
Starting commit: `1867726`  
Contract: `docs/api/openapi.json` — 171 paths, 220 operations, 185 schemas

## 1. Executive summary

Phase 1 is implemented against the user-supplied full OpenAPI contract. Generated types are current; breaking list and referee migrations compile; billing/entitlements, profile lifecycle, application management/readiness, requirements/tasks and secure academic-document lifecycle are connected to server state.

The user also expanded the visual scope during implementation. The closing CTA now uses `src/assets/illustrations/application-path.png`, and the “One connected workspace” introduction uses `src/assets/illustrations/connected-workspace.png` on its right side. Both were positioned responsively and browser-verified.

Ponytail full mode kept the solution dependency-free: TanStack Query, native URL/search/dialog/form/table/progress/drag controls and the existing transport were sufficient. Impeccable and UI-UX Pro Max influenced hierarchy, touch targets, responsive behavior and audit coverage while preserving the committed Academic Compass visual identity.

## 2. Files and modules changed

- Contract/generated layer: `docs/api/openapi.json`, `src/generated/api/schema.ts`.
- Shared API utilities: `pagination.ts`, `mutations.ts`, `download.ts`, `ConflictNotice.tsx`, expanded query keys.
- Billing: `billing.ts`, `billing/provider.tsx`, `BillingPage.tsx`, private-root provider and routes.
- Profile/settings: academic profile import/delete/version detail/restore plus locale/timezone and privacy download.
- Applications: list/board/bulk/actions, workspace readiness/submission, requirement/task order/validation/version updates.
- Documents: vault/detail/scan/download/link/unlink/delete-warning flows.
- Breaking consumers: catalogue, stories, references, referee portal and Writing Studio archive filter.
- Marketing/visuals: live plan catalogue presentation and the two supplied PNG illustrations.
- Tests: Phase 1 unit/E2E coverage and updated existing Playwright fixtures.
- Documentation: start review, completion report, API matrix, contract gaps, reuse map, architecture decisions, Impeccable audit and Phase 2 heads-up.

## 3. Routes and screens added or changed

- Added `/app/settings/billing`, `/app/settings/billing/:result` and `/app/documents/:id`.
- Upgraded `/pricing`, `/app/academic-profile`, `/app/settings/profile`, `/app/settings/privacy`, `/app/applications`, `/app/applications/:id`, `/app/documents`, `/app/references` and `/app/writing`.
- Updated the landing closing CTA and connected-workspace introduction without changing routes.

## 4. APIs integrated

- Billing: plans, subscription, entitlements, usage, checkout, customer portal, token products, token checkout and purchases.
- Profile: get/put/delete, import, version list/detail and restore.
- Applications: cursor list, filtered board, bulk update, duplicate, archive, delete, export, readiness, submit and versioned patch.
- Requirements/tasks: single and bulk create, reorder, validate, versioned update.
- Documents: signed upload/register/list/detail/scan/download/delete and application link/list/unlink.
- Breaking migrations: reference wrapper/create response/referee submission, catalogue wrappers, story wrapper and Writing Studio `includeArchived`.

Every Appendix A/B operation has a status in [api-delta-matrix.md](./api-delta-matrix.md).

## 5. Breaking API migrations completed

- `ApplicationListResponse`, `AcademicReferenceListResponse`, institution/programme/scholarship list responses and `StoryListResponse` now use `.items` and cursor metadata where applicable.
- Reference creation no longer exposes an invite token. Referee submission sends the full decision/identity/attestation schema and keeps the reference code in a header-only in-memory flow.
- Writing documents send `includeArchived` and expose archive/restore status controls.
- No `/metric` frontend call exists.

## 6. EliteResume reuse

No source-product module is imported. Authentication, fetch transport, TanStack Query ownership, checkout redirect, signed upload, polling, version conflict and responsive-table patterns were adapted with EliteApply routes, copy, entitlements and identifiers. See [eliteresume-reuse-map.md](./eliteresume-reuse-map.md).

## 7. Query cache and invalidation

- Stable domain roots cover billing, profile, applications, workspace/readiness, documents and catalogue.
- Checkout result routes invalidate billing state.
- Profile import/restore/delete invalidates profile, versions, dashboard, onboarding and intelligence-related data.
- Application mutations invalidate application roots and dashboard; submit also refreshes workspace and board consumers.
- Document link mutations invalidate both current links and the application workspace.
- Board moves update only the filtered board snapshot optimistically, roll back on error and refetch afterward.

## 8. Idempotency and optimistic concurrency

- `newMutationId` and `mutationIdFor` centralize UUID creation. IDs are created before logical actions and passed as stable mutation variables; billing keeps an action-keyed registry across retries.
- Application/profile/task/requirement mutations send current `expected_version` where the schema supports it.
- Board stage moves retain a full rollback snapshot. Reusable conflict UI prompts users to refresh rather than overwriting.
- Requirement/task add forms reset only after success; bulk text remains intact on failure.

## 9. UX states

- Loading, empty, error and retry states are present for every new primary query.
- Bulk applications report updated versus conflict/not-found/invalid outcomes.
- Quota states distinguish near-limit and exhausted usage.
- Document states distinguish scanning, clean, rejected and failed; link/download remain disabled until usable.
- Submission is disabled until readiness is `ready`, rechecked immediately before mutation and never exposes an unsupported override.
- Permission/availability assumptions are not derived from plan names or catalogue labels.

## 10. Accessibility and responsive checks

- Semantic headings, labels, tables, dialogs, status/alert regions, progress elements and text status accompany color.
- Requirements/tasks support native pointer drag plus labeled keyboard move controls.
- Application action targets are 44px; filters, bulk bar, tables, billing and artwork reflow at mobile breakpoints.
- Reduced-motion behavior remains supported.
- Rendered QA at 1440×1000 and 390×844 found zero horizontal overflow and no console/runtime messages.
- Impeccable score: 17/20; details and remaining P2/P3 items are in [phase-1-impeccable-audit.md](./phase-1-impeccable-audit.md).

## 11. Tests and exact results

- OpenAPI reproducibility: generated a fresh schema to `/tmp` and byte-compared it with `src/generated/api/schema.ts` — pass.
- `npm run typecheck` — pass.
- `npm test` — 5 files, 16 tests passed.
- `npm run build` — pass; 1,777 modules transformed.
- `git diff --check` — pass.
- Playwright Chromium — all 28 tests passed in bounded subsets:
  - landing: 12/12;
  - marketing: 7/7;
  - Phase 1 delta + application board: 4/4;
  - dashboard: 2/2;
  - Phase 3 regression: 2/2;
  - academic profile: 1/1.
- Focused render QA verified billing calculator `$0.30`, clean-scan download enablement, CTA/capability artwork, desktop/mobile overflow `0` and no captured console warnings/errors.

## 12. Bundle/performance impact

- Main JS: 372.91 KB (113.63 KB gzip).
- CSS: 153.64 KB (27.35 KB gzip).
- Application list lazy chunk: 18.56 KB (5.66 KB gzip).
- Workspace lazy chunk: 16.53 KB (5.01 KB gzip).
- Billing lazy chunk: 9.52 KB (3.36 KB gzip).
- Supplied lazy-loaded PNGs: 506.42 KB and 857.11 KB. They are below the fold, explicitly sized and async-decoded; next-gen derivatives are a documented optimization.
- No runtime dependency was added.

## 13. Analytics events

None added. The existing analytics schema was not expanded, and sensitive reference codes, storage keys, checkout URLs and payloads remain outside analytics/logging.

## 14. Feature flags

No new flag was invented. Entitlements and server catalogue availability gate behavior directly.

## 15. Known contract gaps

Plan presentation metadata, inconsistent download shapes, unarchive policy, submission-override policy and other cross-phase gaps are documented in [contract-gap-log.md](./contract-gap-log.md). No Phase 1 operation is blocked.

## 16. Changed assumptions and prompt deviations

- The preliminary deployed 88-path snapshot was incomplete; the user's 171-path file became authoritative and invalidated the earlier start-review assumption.
- UI-UX Pro Max's generic dark/green recommendation was rejected because it conflicted with the established Academic Compass identity; its accessibility/responsive guidance was retained.
- Native platform controls replaced proposed library abstractions.
- Plan prices are not displayed because the contract supplies no price/currency metadata.
- Submission override remains hidden without product policy.
- The two user-supplied illustrations were added after the original delta prompt and are included in Phase 1.

## 17. Deferred work / Phase 2 heads-up

Phase 2 owns catalogue discovery/details, expanded intelligence, Writing Studio collaboration/generation, stories filters and share/collaborator workflows. Start with [phase-2-heads-up.md](./phase-2-heads-up.md) and validate this report against code/OpenAPI first.

## 18. Rollback notes

- Billing routes/provider can be removed independently from the existing auth shell.
- New UI routes are lazy loaded; removing route entries restores prior navigation without changing generated types.
- Application/profile/document API adapters are outside the generated file and can be reverted domain-by-domain.
- Do not roll back `openapi.json` or generated types while the backend uses the 171-path contract.
- The two decorative image imports/CSS can be removed without affecting product workflows.

## 19. API coverage matrix

The complete 139-row Appendix A/B matrix is [api-delta-matrix.md](./api-delta-matrix.md), using only `integrated`, `existing`, `deferred`, `admin-only`, `public-only` and `blocked` statuses.

## 20. Final acceptance checklist

- [x] No changed list consumer expects a direct array.
- [x] Billing and entitlement screens use server state.
- [x] Application filters persist in the URL and cursor loading uses opaque cursors.
- [x] Bulk updates expose stage/priority/tags and partial outcomes.
- [x] Readiness and normal submission flow are complete.
- [x] Requirement/task drag and keyboard ordering, validation and version updates are wired.
- [x] Document scanning and link/unlink flows work end to end.
- [x] Contract, type, unit, build and all Chromium tests pass.
- [x] Required reports and Phase 2 heads-up are present.

Phase 1 stops here.
