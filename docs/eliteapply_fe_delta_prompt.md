# EliteApply Frontend Delta Upgrade — Three-Phase Agent Prompt

## How to run this prompt

This prompt upgrades the **existing El/seaiteApply frontend** after a major backend API expansion. It is not a greenfield rebuild.

Run one phase at a time:

- `Execute Phase 1 only from eliteapply_fe_delta_prompt.md.`
- `Execute Phase 2 only. First validate the Phase 1 completion report against the code and current OpenAPI.`
- `Execute Phase 3 only. First validate all earlier phase reports and rerun the contract coverage checks.`

The agent must stop after the requested phase and write the required report. Do not automatically continue to the next phase.

---

# 1. Role and mission

Act as a principal frontend engineer responsible for upgrading **EliteApply.net**, the student application operating system, against the newest backend OpenAPI contract.

The frontend was previously implemented against an older contract containing approximately:

- 73 paths
- 91 operations
- 77 schemas

The new contract contains:

- 171 paths
- 220 operations
- 185 schemas
- 129 newly added operations
- 10 existing operations with contract changes
- no removed operations

Your job is to inspect the current frontend, preserve working functionality and EliteResume-derived foundations, then implement the API delta and all newly enabled product workflows.

Do not rewrite the application solely to make it resemble this prompt. Make the smallest coherent production-grade change set that fully supports the current contract.

---

# 2. Sources of truth

Use these sources in this order:

1. The latest `openapi.json` in the backend or repository
2. The actual EliteApply frontend code and its current runtime behavior
3. Existing frontend tests
4. Current frontend architecture and design-system documentation
5. Existing EliteResume frontend components and patterns that were intentionally reused
6. Previous EliteApply phase reports
7. This prompt

When this prompt conflicts with the latest OpenAPI schema, follow OpenAPI and record the discrepancy.

Never invent an endpoint, response field, enum or permission. Do not silently retain an old contract shape after regenerating types.

---

# 3. Mandatory phase protocol

## 3.1 Start review

Before each phase, create:

```text
docs/frontend/phase-N-start-review.md
```

Include:

1. Branch and commit
2. Framework, router, state management, API client, form library and test stack
3. Current generated API type/client location
4. Current OpenAPI path, operation and schema counts
5. Existing screens related to the phase
6. Existing EliteResume components being reused
7. Current API coverage and mocks
8. Existing assumptions from earlier phases
9. Assumptions invalidated by the new contract
10. Breaking contract migrations required
11. Accessibility, responsive and security implications
12. Exact implementation sequence

For Phase 2 and Phase 3, verify prior completion reports against the actual code. Never trust a report without checking the implementation and tests.

## 3.2 Completion report

At the end of each phase, create:

```text
docs/frontend/phase-N-completion-report.md
```

Include:

1. Executive summary
2. Files and modules changed
3. Routes and screens added or changed
4. APIs integrated
5. Breaking API migrations completed
6. EliteResume code reused and adaptations made
7. Query-cache and invalidation behavior
8. Idempotency and optimistic-concurrency behavior
9. Loading, empty, partial, error and permission states
10. Accessibility and responsive checks
11. Tests and exact results
12. Bundle or performance impact
13. Analytics events added
14. Feature flags used
15. Known contract gaps
16. Changed assumptions
17. Deferred work
18. Rollback notes
19. API coverage matrix with `integrated`, `existing`, `deferred`, `admin-only`, `public-only` or `blocked`
20. Final acceptance checklist

Also maintain:

```text
docs/frontend/api-delta-matrix.md
docs/frontend/contract-gap-log.md
docs/frontend/eliteresume-reuse-map.md
docs/frontend/architecture-decisions.md
```

Then stop.

---

# 4. Non-negotiable engineering rules

## 4.1 Preserve and audit reuse

Search the EliteApply and EliteResume frontend code before creating new implementations. Reuse or adapt proven components for:

- Zitadel/OIDC authentication and protected routes
- token refresh and logout
- API request middleware and correlation IDs
- billing, checkout redirects, customer portal and quota displays
- cursor pagination
- optimistic updates and `expected_version` conflicts
- file upload and download helpers
- async job polling
- rich-text editing and document previews
- comments and share links
- reference verification and referee portal
- interview practice and audio recording
- notifications and reminder UI
- feature flags, analytics and error boundaries

Never import EliteResume product copy, route names, Stripe price identifiers, analytics names or entitlement assumptions without adapting them to EliteApply.

## 4.2 Regenerate, do not hand-maintain the contract

Regenerate the typed API client from the latest OpenAPI before feature work. Commit the generated output if that is the repository convention.

Required behavior:

- fail CI when generated types are stale
- keep custom adapters outside generated files
- prohibit `any` wrappers around generated schemas unless the schema is genuinely untyped
- use a central transport for auth, errors, correlation IDs and retries
- never edit generated code manually

## 4.3 API-state conventions

Follow the current repository state library. If TanStack Query is already used, retain it.

Implement:

- stable domain query keys
- cursor-based infinite queries for paginated endpoints
- request cancellation for abandoned searches
- debounced search without firing empty duplicate requests
- exact cache invalidation after every mutation
- optimistic updates only when rollback is reliable
- background refetch after checkout, generation completion, reference actions and interview completion
- no duplicated server state in global client stores

## 4.4 Mutation IDs and safe retries

For every request containing `mutation_id`:

- create it with `crypto.randomUUID()` when the user begins one logical action
- reuse the same value when retrying that same action after a transport failure
- generate a new value for a distinct user action
- never regenerate automatically between an HTTP retry and the original attempt

## 4.5 Optimistic concurrency

Where `expected_version` is required or available:

- send the latest server version
- handle `409` as a first-class conflict
- retain the user's unsaved values
- refetch the latest entity
- show what changed
- allow the user to reapply or discard their change
- do not silently overwrite newer server data

This applies to applications, requirements, tasks, reminders, references and any other versioned entities.

## 4.6 Error model

Provide consistent UX for:

- `400`: invalid action or state
- `401`: refresh once, then reauthenticate
- `403`: permission-specific UI, not a generic crash
- `404`: contextual not-found page
- `409`: version or state conflict flow
- `413`: file too large
- `415`: unsupported file/audio type
- `422`: field-level validation mapping
- `429`: quota/rate-limit state with retry guidance
- `5xx`: retryable failure with correlation ID

Never expose raw provider errors, tokens, storage keys, prompts or internal stack traces.

## 4.7 Downloads and underspecified responses

Several download endpoints remain weakly typed. Build one defensive download helper that can safely handle:

- direct binary responses
- signed-URL JSON responses
- redirects
- plain-text URLs
- Blob responses

Use `Content-Type`, `Content-Disposition` and runtime payload inspection. Do not call `.json()` blindly.

Apply it to writing exports, application exports, reference certificates/downloads, calendar feeds, GDPR export and storage downloads where relevant.

## 4.8 Accessibility and quality

All new work must include:

- keyboard navigation
- visible focus states
- semantic labels and field errors
- screen-reader announcements for async completion and failures
- reduced-motion handling
- mobile and tablet layouts
- skeletons that preserve layout
- clear empty states with one primary action
- no color-only status communication
- WCAG AA contrast

---

# 5. Breaking contract migrations that must happen first

Complete these migrations before adding new UI.

## 5.1 List response migrations

The following APIs no longer return arrays directly:

| Endpoint                               | Old shape                       | New shape                         |
| -------------------------------------- | ------------------------------- | --------------------------------- |
| `GET /api/v1/applications`           | `ApplicationResponse[]`       | `ApplicationListResponse`       |
| `GET /api/v1/academic-references`    | `AcademicReferenceResponse[]` | `AcademicReferenceListResponse` |
| `GET /api/v1/catalogue/institutions` | `InstitutionResponse[]`       | `InstitutionListResponse`       |
| `GET /api/v1/catalogue/programmes`   | `ProgrammeResponse[]`         | `ProgrammeListResponse`         |
| `GET /api/v1/catalogue/scholarships` | `ScholarshipResponse[]`       | `ScholarshipListResponse`       |
| `GET /api/v1/writing-studio/stories` | `StoryResponse[]`             | `StoryListResponse`             |

Every migrated consumer must use:

```ts
{
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  total: number | null;
}
```

Do not add a global adapter that disguises pagination as a plain array. Domain hooks should expose both items and page metadata.

## 5.2 Existing endpoint parameter changes

- `GET /applications` now supports search, stage, application type, priority, institution, programme, scholarship, deadline range, tag, archived state, sort, cursor and limit.
- `GET /applications/board` now supports application type, priority, institution and deadline filters.
- Institution, programme and scholarship lists now support richer filters and cursor pagination.
- `GET /writing-studio/documents` adds `includeArchived` but still returns an array.
- `GET /writing-studio/stories` adds category, sensitivity, search, cursor and limit.
- `GET /academic-references` adds status, cursor and limit.
- `/metric` is deprecated. Do not call it from the frontend; use `/metrics` only for operational tooling.

## 5.3 Response and model changes

Update all consumers for these additions:

- `ApplicationResponse`: `submitted_at`, `pre_archive_stage`
- `AcademicInterviewResponse`: current question/index, report, context hash, completed/cancelled times
- `AcademicReferenceResponse`: expiry, decline/cancel/reminder fields, resend count, version, attestation and existing document
- `GenerationRunResponse`: `retry_of_id`
- Requirements and tasks: `position`, `version`; requirements also include validation source
- Stories: `version`
- Catalogue entities: `visibility`, `source_provenance`, `last_verified_at`
- User profile: `timezone`, `locale`

## 5.4 Request changes

- `OpportunityImportCreate.raw_source_text` is now optional. For URL imports, do not require pasted text.
- `InterviewAnswer.question` is optional. Prefer server-owned current question state.
- `AcademicReferenceCreate` supports `existing_document_id`.
- `RefereeSubmission.final_content` is optional and the submission now supports approve/decline, attestations, relationship confirmation, role/title, signature and existing document ID.
- `RequirementUpdate` and `TaskUpdate` support `expected_version`.

## 5.5 Reference creation response change

`POST /api/v1/academic-references` now returns `AcademicReferenceResponse`, not `AcademicReferenceInviteResponse`.

Remove any frontend dependency on a returned referee invitation token. The invitation is delivered server-side. After creation, show status, expiry and next actions from the reference object only.

---

# 6. Cross-cutting contract gaps and constraints

Record these in `docs/frontend/contract-gap-log.md` and implement safe behavior:

1. `PlanOption` does not expose price, currency, marketing label or feature copy. Use a reviewed frontend presentation map keyed by `plan.key` only for display. Availability and checkout must remain server-driven.
2. Writing PDF/DOCX exports, reference certificates, calendar feed, storage file and GDPR export are not consistently typed as binary or signed URL responses. Use the defensive download helper.
3. Voice interviews are recorded-turn uploads. There is no realtime voice stream or TTS endpoint. Do not present the experience as a live voice call.
4. The contract exposes archive but no explicit unarchive endpoint. Only offer restore if `PATCH /applications/{id}` accepts a valid non-archived stage using `pre_archive_stage`; otherwise hide restore and log the gap.
5. Notifications can be marked read but not deleted or archived. Do not add fake delete controls.
6. Academic-document and Writing Studio document lists are still unpaginated arrays. Isolate their hooks so pagination can be added later.
7. Multiple status fields are strings without enums. Render unknown statuses safely and send unknown values to telemetry rather than crashing.
8. Public share and referee flows use headers for passcodes/reference codes. Never put those secrets in analytics, logs, query strings or error messages.
9. Catalogue write permissions are not self-describing. Hide editing based on actual authorization behavior and admin/user capabilities, not assumptions.
10. Collaborator invitation acceptance requires authentication. Preserve the token across login without exposing it to analytics or persistent logs.

---

# PHASE 1 — Contract migration, billing, profile, applications and document lifecycle

## Goal

Make the existing frontend safe against the new contract, then implement the platform and application-management features that unblock the rest of the product.

## 1. Contract and data-layer migration

- Regenerate the client and types.
- Fix all compile errors caused by list wrappers and changed schemas.
- Add cursor-page utilities without altering generated types.
- Add domain query-key factories.
- Add a reusable 409 conflict component and mutation helper.
- Add a reusable mutation-ID helper that preserves IDs across transport retries.
- Add the defensive download helper.
- Remove frontend calls to deprecated `/metric`.
- Update MSW/mocks/fixtures to the new response shapes.
- Add a contract test proving generated types match the committed OpenAPI.

## 2. Billing, plans, usage and entitlements

Implement or upgrade:

- Public pricing/plan selector using `GET /api/v1/billing/plans`
- Authenticated billing settings page
- Subscription status and renewal/cancellation presentation
- Entitlement provider used by all AI and premium features
- Monthly AI usage summary and cursor-paginated usage ledger
- Purchased-token balance
- Token-product calculator using min, step, max and cents-per-1k from the API
- Subscription checkout
- Token top-up checkout
- Stripe customer portal redirect
- Checkout success/cancel routes that refetch subscription, entitlements and usage
- Quota banners and near-limit warnings
- Disabled and explanatory states when a feature is not entitled

API references:

```text
GET  /api/v1/billing/plans
GET  /api/v1/billing/subscription
GET  /api/v1/billing/entitlements
GET  /api/v1/billing/usage?period=current&cursor=&limit=
POST /api/v1/billing/checkout
POST /api/v1/billing/customer-portal
GET  /api/v1/billing/token-products
POST /api/v1/billing/token-checkout
GET  /api/v1/billing/purchases
```

Rules:

- Never decide entitlement from a plan name in local storage.
- Treat purchased tokens as supplemental balance, not a separate plan.
- Use API-provided token min/step/max.
- Reuse EliteResume billing UI only after replacing all product-specific identifiers and copy.
- Do not display fabricated prices when presentation metadata is missing.

## 3. Academic profile lifecycle

Implement:

- Timezone and locale fields in account/profile settings
- Profile version timeline
- Version-detail drawer or page
- Restore confirmation with expected version
- Structured import dialog with overwrite warning
- Delete-profile danger flow
- Refetch dashboard/onboarding/application intelligence after profile import, restore or delete

API references:

```text
GET    /api/v1/academic-profile
PUT    /api/v1/academic-profile
DELETE /api/v1/academic-profile
GET    /api/v1/academic-profile/versions
GET    /api/v1/academic-profile/versions/{version_id}
POST   /api/v1/academic-profile/versions/{version_id}/restore
POST   /api/v1/academic-profile/import
```

## 4. Application list, board and bulk management

Upgrade application management with:

- Cursor-paginated list view
- URL-synchronized filters
- Search, stage, type, priority, institution, programme, scholarship, deadline, tag and archived filters
- Sort selector
- Infinite load or explicit “Load more”; do not simulate page numbers over cursors
- Board filters supported by the API
- Bulk selection and bulk stage/priority/tag changes
- Partial-result handling for bulk updates (`updated`, `conflict`, `not_found`, `invalid`)
- Per-row/card actions for duplicate, archive, delete and export
- Archive confirmation preserving `pre_archive_stage`
- Duplicate modal with copy requirements/tasks options
- Optimistic board moves with rollback and version conflict handling

API references:

```text
GET    /api/v1/applications
GET    /api/v1/applications/board
POST   /api/v1/applications/bulk-update
POST   /api/v1/applications/{application_id}/duplicate
POST   /api/v1/applications/{application_id}/archive
DELETE /api/v1/applications/{application_id}
GET    /api/v1/applications/{application_id}/export
PATCH  /api/v1/applications/{application_id}
```

## 5. Application readiness and submission

Add a prominent readiness surface inside the application workspace:

- readiness percentage and overall state
- blocking issues
- warnings
- missing required documents
- incomplete requirements
- unresolved eligibility issues
- deadline state
- recommended next actions

Submission flow:

1. Fetch readiness immediately before submission.
2. Block normal submission when blockers exist.
3. Only expose override when product policy permits it.
4. Require an explicit confirmation when overriding incomplete requirements.
5. Submit with the current application version.
6. Update stage and `submitted_at` from the returned application.
7. Refresh history, dashboard, board and notifications.

API references:

```text
GET  /api/v1/applications/{application_id}/readiness
POST /api/v1/applications/{application_id}/submit
```

## 6. Requirements and tasks

Implement:

- Bulk creation for imported or templated checklists
- Drag-and-drop reorder with keyboard-accessible alternatives
- Requirement validation action and validation-source display
- Version-aware updates for requirements and tasks
- Conflict recovery without losing unsaved form data
- Bulk operations that update the workspace without full reload

API references:

```text
POST /api/v1/applications/{application_id}/requirements/bulk
POST /api/v1/applications/{application_id}/requirements/reorder
POST /api/v1/applications/{application_id}/requirements/{requirement_id}/validate
PATCH /api/v1/applications/{application_id}/requirements/{requirement_id}
POST /api/v1/applications/{application_id}/tasks/bulk
POST /api/v1/applications/{application_id}/tasks/reorder
PATCH /api/v1/applications/{application_id}/tasks/{task_id}
```

## 7. Academic document lifecycle

Upgrade the document vault and application linking:

- Document detail view
- Upload progress and validation
- Scan status polling
- Explicit scanning, clean, rejected and failed states
- Disable download/linking until safe where backend status requires it
- Link picker inside application workspace
- List current links
- Unlink with confirmation
- Delete document with dependent-link warning
- Use signed download responses safely

API references:

```text
POST   /api/v1/academic-documents/upload-url
POST   /api/v1/academic-documents
GET    /api/v1/academic-documents
GET    /api/v1/academic-documents/{document_id}
GET    /api/v1/academic-documents/{document_id}/scan-status
GET    /api/v1/academic-documents/{document_id}/download
DELETE /api/v1/academic-documents/{document_id}
POST   /api/v1/applications/{application_id}/documents
GET    /api/v1/applications/{application_id}/documents
DELETE /api/v1/applications/{application_id}/documents/{link_id}
```

## Phase 1 acceptance criteria

- No consumer expects old direct-array responses for migrated APIs.
- All billing and entitlement screens use server state.
- Application filters persist in the URL and cursor pagination works.
- Bulk updates handle partial conflicts.
- Readiness and submit flows are complete.
- Requirement/task reordering is accessible and version-safe.
- Document scanning and link/unlink flows work end to end.
- Typecheck, lint, unit, integration and critical E2E tests pass.
- The Phase 1 report is complete.

Then stop.

---

# PHASE 2 — Discovery, intelligence, Writing Studio and collaboration

## Goal

Implement the complete discovery-to-writing workflow and reviewer collaboration enabled by the expanded API.

## 1. Catalogue discovery and detail pages

Implement institution, programme and scholarship discovery with:

- Cursor pagination
- Search and API-supported filters
- Detail routes
- Clear `private` versus `canonical` visibility badges
- Verification/provenance and last-verified presentation
- Safe source links
- Create/edit/delete controls only when authorization permits
- Application creation CTA prefilled from catalogue context
- Empty and stale-data states

API references:

```text
GET/POST         /api/v1/catalogue/institutions
GET/PATCH/DELETE /api/v1/catalogue/institutions/{institution_id}
GET/POST         /api/v1/catalogue/programmes
GET/PATCH/DELETE /api/v1/catalogue/programmes/{programme_id}
GET/POST         /api/v1/catalogue/scholarships
GET/PATCH/DELETE /api/v1/catalogue/scholarships/{scholarship_id}
```

Do not treat user-created private catalogue records as globally verified records.

## 2. Saved searches, matches and recommendations

Build:

- Save-current-search action
- Saved-search management page
- Rename/edit/delete
- Run-now action
- Match form using degree level, field, country and limit
- Recommendation cards with the backend disclaimer always visible
- “Create application” action from a result
- No admission-probability claims

API references:

```text
GET/POST         /api/v1/saved-searches
GET/PATCH/DELETE /api/v1/saved-searches/{saved_search_id}
POST             /api/v1/saved-searches/{saved_search_id}/run
POST             /api/v1/application-intelligence/matches
GET              /api/v1/application-intelligence/recommendations
```

## 3. Import lifecycle and eligibility

Upgrade imports:

- URL-only import without requiring raw pasted text
- Pasted-text import when selected
- Import history with cursor pagination
- Status UI, polling and retry/cancel/delete controls
- Confirmation editor for extracted fields
- Confidence indicators without implying certainty
- Preserve user corrections
- Current eligibility result
- Eligibility history
- Explicit recalculation action
- Readiness invalidation after eligibility changes

API references:

```text
POST   /api/v1/application-intelligence/imports
GET    /api/v1/application-intelligence/imports
GET    /api/v1/application-intelligence/imports/{import_id}
POST   /api/v1/application-intelligence/imports/{import_id}/confirm
POST   /api/v1/application-intelligence/imports/{import_id}/retry
POST   /api/v1/application-intelligence/imports/{import_id}/cancel
DELETE /api/v1/application-intelligence/imports/{import_id}
GET    /api/v1/application-intelligence/applications/{application_id}/eligibility
GET    /api/v1/application-intelligence/applications/{application_id}/eligibility/history
POST   /api/v1/application-intelligence/applications/{application_id}/eligibility/recalculate
```

## 4. Writing templates and creation workflow

Implement:

- Template browser filtered by document and application type
- Template-detail preview
- Document creation wizard
- Application attachment/detachment
- Duplicate and delete actions
- Archived document filtering
- Preview surface using API-rendered HTML safely
- Word and character limit indicators
- Academic CV mode support where the schema allows it

API references:

```text
GET  /api/v1/writing-studio/templates
GET  /api/v1/writing-studio/templates/{template_id}
POST /api/v1/writing-studio/documents
GET  /api/v1/writing-studio/documents
GET  /api/v1/writing-studio/documents/{document_id}
PATCH /api/v1/writing-studio/documents/{document_id}
DELETE /api/v1/writing-studio/documents/{document_id}
POST /api/v1/writing-studio/documents/{document_id}/duplicate
POST /api/v1/writing-studio/documents/{document_id}/attach/{application_id}
POST /api/v1/writing-studio/documents/{document_id}/detach/{application_id}
GET  /api/v1/writing-studio/documents/{document_id}/preview
```

Sanitize API-provided preview HTML. Do not inject untrusted HTML directly.

## 5. Async generation lifecycle

Replace any blind timeout or document polling with generation-run state:

1. Start generation.
2. Store the returned run ID.
3. Poll the run endpoint with bounded exponential backoff.
4. Stop on terminal state.
5. Refresh document, revisions, usage and entitlements on success.
6. Display safe failure reason on failure.
7. Allow cancellation only while cancellable.
8. Allow retry as a distinct API action while displaying `retry_of_id` lineage.
9. Resume active runs after navigation/reload using document generation history.
10. Pause noncritical polling when the tab is hidden.

API references:

```text
POST /api/v1/writing-studio/documents/{document_id}/generate
GET  /api/v1/writing-studio/documents/{document_id}/generation-runs
GET  /api/v1/writing-studio/generation-runs/{run_id}
POST /api/v1/writing-studio/generation-runs/{run_id}/cancel
POST /api/v1/writing-studio/generation-runs/{run_id}/retry
```

Gate generation using entitlements, but let the backend remain authoritative.

## 6. Analysis, revisions, stories and exports

Implement:

- Current analysis and analysis history
- Revision history and restore
- Story Bank cursor pagination
- Story category/sensitivity/search filters
- Story detail, edit and delete
- Version-aware story editing if supported by the request schema
- TXT, PDF and DOCX exports through the defensive download helper
- Clear distinction between analysis guidance and guaranteed outcome

API references:

```text
POST /api/v1/writing-studio/documents/{document_id}/analyze
GET  /api/v1/writing-studio/documents/{document_id}/analyses
GET  /api/v1/writing-studio/documents/{document_id}/revisions
POST /api/v1/writing-studio/documents/{document_id}/revisions/{revision_id}/restore
GET/POST /api/v1/writing-studio/stories
GET/PATCH/DELETE /api/v1/writing-studio/stories/{story_id}
GET /api/v1/writing-studio/documents/{document_id}/export.txt
GET /api/v1/writing-studio/documents/{document_id}/export.pdf
GET /api/v1/writing-studio/documents/{document_id}/export.docx
```

## 7. Application collaborators

Implement:

- Collaborator list
- Invite by email
- Roles: viewer, commenter, advisor editor
- Role update and removal
- Invitation acceptance route preserving token through authentication
- Permission-aware collaborator view
- Read-only and comment-only UI enforcement
- Server authorization remains authoritative

API references:

```text
GET/POST         /api/v1/applications/{application_id}/collaborators
PATCH/DELETE     /api/v1/applications/{application_id}/collaborators/{collaborator_id}
GET              /api/v1/applications/{application_id}/collaborator-view
POST             /api/v1/collaborator-invitations/{token}/accept
```

## 8. Writing comments and public share links

Implement authenticated comments:

- anchored and general comments
- revision association
- resolve/reopen
- edit/delete
- comment count and unresolved indicators

Implement share links:

- view or comment scope
- optional passcode
- optional expiry
- active-link management and revocation
- copy link action without logging token
- public share route with passcode prompt
- public comment form only when scope permits

API references:

```text
GET/POST     /api/v1/writing-studio/documents/{document_id}/comments
PATCH/DELETE /api/v1/writing-studio/comments/{comment_id}
GET/POST     /api/v1/writing-studio/documents/{document_id}/share-links
DELETE       /api/v1/writing-studio/documents/{document_id}/share-links/{share_link_id}
GET          /api/v1/share/{token}
POST         /api/v1/share/{token}/comments
```

Send public passcodes only in `X-Share-Passcode`. Never store them in analytics or URLs.

## Phase 2 acceptance criteria

- Discovery lists use cursor pagination and all supported filters.
- Private/canonical records are visibly distinct.
- Saved searches and recommendations work without misleading claims.
- Import history, retries, cancellation and eligibility history work.
- Generation is run-based, cancellable, retryable and resumable.
- Story CRUD, analyses, previews and exports are complete.
- Collaboration permissions are reflected in UI and verified server-side.
- Public share/comment routes are secure and accessible.
- Tests and the Phase 2 report are complete.

Then stop.

---

# PHASE 3 — References, interviews, notifications, reminders, admin and launch hardening

## Goal

Complete the high-trust engagement workflows and production operational surfaces.

## 1. Verified academic references

Upgrade the candidate reference hub:

- Cursor-paginated list with status filter
- Reference detail page
- Create flow for:
  - student draft
  - referee direct
  - existing upload
- Existing-upload mode must select an uploaded academic document and send `existing_document_id`
- Confidentiality acknowledgement
- Destination management from the create schema
- Edit before terminal states using `expected_version`
- Resend and remind actions with clear cooldown/error feedback
- Cancel and revoke as distinct actions
- Expiry countdown
- Event timeline
- Certificate and letter download
- Verification link/copy action based only on `public_id`

API references:

```text
GET/POST /api/v1/academic-references
GET/PATCH /api/v1/academic-references/{request_id}
POST /api/v1/academic-references/{request_id}/resend
POST /api/v1/academic-references/{request_id}/remind
POST /api/v1/academic-references/{request_id}/cancel
POST /api/v1/academic-references/{request_id}/revoke
GET  /api/v1/academic-references/{request_id}/events
GET  /api/v1/academic-references/{request_id}/certificate
GET  /api/v1/academic-references/{request_id}/download
GET  /api/v1/verify/academic-reference/{public_id}
```

Important:

- Creation no longer returns a referee invitation token.
- Do not expose referee email after the contract intentionally omits it from the response.
- Treat cryptographic event hashes as integrity metadata, not proof of identity.
- Keep the verification disclaimer visible.

## 2. Referee public workflow

Upgrade the public referee route:

- Require the code through `X-Reference-Code`
- Support approve and decline decisions
- Collect required referee display name
- Support final content or existing document as the mode allows
- Collect authenticity, authority and relationship confirmations
- Support role title, relationship duration, conflict disclosure and signature name
- Show exact consent language before submission
- Prevent accidental double submission
- Provide terminal-state receipt
- Never leak token or code into analytics, logs or error tracking

API references:

```text
GET  /api/v1/referee/academic-reference/{token}
POST /api/v1/referee/academic-reference/{token}/submit
```

## 3. Interview session lifecycle

Implement:

- Interview history with cursor pagination
- Create wizard for undergraduate, graduate, MBA, PhD supervisor, scholarship panel, research fellowship, visa credibility and custom modes
- Chat/written session screen
- Server-owned current question; do not require client-generated question text
- Turn history and contradiction warnings
- Session resume
- Cancel and complete actions
- Final report with score, rubric explanation, categories, strengths, improvements, weak claims, contradictions, per-question summary and practice actions
- Visible disclaimer

API references:

```text
GET/POST /api/v1/academic-interviews
GET  /api/v1/academic-interviews/{interview_id}
GET  /api/v1/academic-interviews/{interview_id}/turns
POST /api/v1/academic-interviews/{interview_id}/answers
POST /api/v1/academic-interviews/{interview_id}/complete
POST /api/v1/academic-interviews/{interview_id}/cancel
GET  /api/v1/academic-interviews/{interview_id}/report
```

## 4. Recorded voice-answer workflow

Implement voice as asynchronous recorded turns, not a realtime call.

Flow:

1. Check `MediaRecorder` support and microphone permission.
2. Record one answer.
3. Validate API-supported MIME type and maximum size.
4. Request upload details with `content_type` and explicit consent.
5. Upload using the returned method and fields.
6. Complete upload with audio ID and exact byte size.
7. Poll audio status.
8. When transcript/turn is ready, refresh turns and interview state.
9. Allow retry after recoverable upload failure without duplicating a completed answer.
10. Provide a text fallback.

API references:

```text
POST /api/v1/academic-interviews/{interview_id}/audio/upload-url
POST /api/v1/academic-interviews/{interview_id}/audio/complete
GET  /api/v1/academic-interviews/{interview_id}/audio/{audio_id}
```

Supported content types are defined by OpenAPI. Do not hardcode browser formats without validating them against the current schema.

There is no TTS or streaming API. Do not show an animated live interviewer or claim realtime voice conversation.

## 5. Notifications

Implement:

- Header unread badge
- Notification center with cursor pagination
- Unread-only filter
- Mark one read
- Mark all read
- Deep-link handling from notification data with allowlisted internal routes
- Mandatory notification treatment
- Preference page by category
- Unknown-category fallback

API references:

```text
GET  /api/v1/notifications
GET  /api/v1/notifications/unread-count
POST /api/v1/notifications/{notification_id}/read
POST /api/v1/notifications/read-all
GET  /api/v1/notification-preferences
PUT  /api/v1/notification-preferences
```

Do not create delete/archive controls because no API exists.

## 6. Reminders and calendar feed

Implement:

- Reminder list with cursor pagination and filters
- Create/edit/delete
- Snooze
- Application, requirement, task, reference, interview and custom reminder contexts
- Timezone-aware date/time inputs based on user profile timezone
- Recurrence input using only backend-supported format
- In-app/email channel selection
- Calendar feed token creation, copy and revocation
- Never expose calendar token to analytics

API references:

```text
GET/POST         /api/v1/reminders
GET/PATCH/DELETE /api/v1/reminders/{reminder_id}
POST             /api/v1/reminders/{reminder_id}/snooze
POST             /api/v1/calendar-feed/token
DELETE           /api/v1/calendar-feed/token
GET              /api/v1/calendar-feed/{token}.ics
```

## 7. Admin operations

Only render these routes for users whose server profile reports `is_admin=true`; still handle `403` from every request.

Implement a compact internal console for:

- Feature flags list and update
- Launch gates/readiness already available in the existing frontend scope
- Async operation list, detail, retry and cancel
- Queue redrive
- User search by email or ID
- User entitlement inspection
- User usage ledger
- Catalogue moderation: pending, approve, reject and merge
- Reference event inspection
- Manual due-reminder run only if operationally intended

API references:

```text
GET /api/v1/admin/feature-flags
GET /api/v1/admin/operations
GET /api/v1/admin/operations/{operation_id}
POST /api/v1/admin/operations/{operation_id}/retry
POST /api/v1/admin/operations/{operation_id}/cancel
POST /api/v1/admin/queues/{queue_name}/redrive
GET /api/v1/admin/users/search
GET /api/v1/admin/users/{user_id}/entitlement
GET /api/v1/admin/users/{user_id}/usage-ledger
GET /api/v1/admin/catalogue/{kind}/pending
POST /api/v1/admin/catalogue/{kind}/{item_id}/approve
POST /api/v1/admin/catalogue/{kind}/{item_id}/reject
POST /api/v1/admin/catalogue/{kind}/{item_id}/merge
GET /api/v1/admin/references/{request_id}/events
POST /api/v1/admin/reminders/run-due
```

Require confirmations for destructive/operational actions. Display correlation IDs and safe failure details, never secrets.

## 8. Analytics, flags and production hardening

- Track meaningful product events through the existing analytics endpoint and client analytics provider.
- Never send document content, reference tokens/codes, share tokens/passcodes, audio/transcripts or sensitive profile data.
- Gate unfinished modules with backend feature flags.
- Add route-level error boundaries.
- Add session-expiry recovery.
- Add CSP-safe handling for previews and downloads.
- Validate SEO/noindex behavior: authenticated app, public share pages containing user content and referee-token pages must be noindex.
- Add Sentry or existing error reporting with field scrubbing.
- Verify browser back/forward behavior for filters and multi-step forms.
- Verify refresh/recovery during active generation, import, reference and interview operations.
- Add E2E coverage for the full golden paths.

## Phase 3 acceptance criteria

- Candidate and referee reference workflows cover all modes and terminal states.
- No invitation token dependency remains.
- Interview sessions can be listed, resumed, completed and reported.
- Voice answers use the real asynchronous upload flow with text fallback.
- Notifications and preferences work with unread counts.
- Reminders and calendar feed are timezone-safe.
- Admin routes are permission-gated and operational actions are confirmed.
- Sensitive tokens and content are excluded from analytics and logs.
- Full test suite and final contract coverage matrix pass.
- The Phase 3 report is complete.

Then stop.

---

# 7. Required test coverage

At minimum, add or update:

## Unit tests

- cursor-page reducers/hooks
- API error mapping
- mutation-ID preservation
- version conflict resolution
- billing/token calculations
- readiness state rendering
- download response detection
- status fallback rendering
- audio content-type selection
- token/passcode redaction

## Integration tests

- list wrapper migrations
- checkout and entitlement refresh
- bulk application partial conflicts
- submit readiness gate
- document scan/link/unlink
- import retry/cancel and eligibility history
- generation polling/cancel/retry
- comments and share links
- reference create/resend/remind/cancel
- referee approve/decline
- interview answer/complete/report
- voice upload and transcript completion
- notification read/read-all
- reminder edit/snooze
- collaborator role enforcement

## E2E golden paths

1. Sign in → complete profile → import profile version → restore previous version.
2. Create application → add requirements/tasks → link scanned document → readiness → submit.
3. Discover scholarship → save search → create application → run eligibility.
4. Create motivation letter → generate → cancel/retry where possible → analyze → comment → share → export.
5. Invite collaborator → accept → comment with correct permissions.
6. Create reference in each supported mode → referee approve/decline → verify/download.
7. Run chat interview → resume → complete → review report.
8. Record/upload voice answer → receive transcript/turn → complete report.
9. Create reminder → snooze → subscribe/revoke calendar feed.
10. Upgrade plan or buy tokens → return from checkout → entitlements and balance refresh.

---

# 8. Definition of done

The frontend delta is complete only when:

- the generated client matches the newest OpenAPI
- all changed list shapes are migrated
- all new user-facing endpoints are integrated or explicitly deferred with reason
- all admin endpoints are integrated or marked admin-only
- no removed `AcademicReferenceInviteResponse` dependency remains
- async workflows recover after reload
- permissions are enforced in UX and server responses
- no sensitive token/content reaches logs or analytics
- mobile, keyboard and screen-reader flows work
- tests pass in CI
- phase reports and coverage matrices are complete

---

# Appendix A — Added endpoint checklist

This appendix is generated from the old and new contracts. Use it as a coverage checklist, not as a replacement for the current OpenAPI.

## Phase 1 newly added operations

| Method     | Endpoint                                                                         | Summary                          | Request schema                    | Success schema                     | Query/header inputs   |
| ---------- | -------------------------------------------------------------------------------- | -------------------------------- | --------------------------------- | ---------------------------------- | --------------------- |
| `GET`    | `/api/v1/academic-documents/{document_id}`                                     | Get Document                     | `-`                             | `DocumentResponse`               | —                    |
| `GET`    | `/api/v1/academic-documents/{document_id}/scan-status`                         | Academic Document Scan Status    | `-`                             | `DocumentScanStatusResponse`     | —                    |
| `DELETE` | `/api/v1/academic-profile`                                                     | Delete Academic Profile          | `-`                             | `No content`                     | —                    |
| `POST`   | `/api/v1/academic-profile/import`                                              | Import Academic Profile          | `AcademicProfileImportRequest`  | `AcademicProfileResponse`        | —                    |
| `GET`    | `/api/v1/academic-profile/versions/{version_id}`                               | Get Academic Profile Version     | `-`                             | `AcademicProfileVersionResponse` | —                    |
| `POST`   | `/api/v1/academic-profile/versions/{version_id}/restore`                       | Restore Academic Profile Version | `AcademicProfileRestoreRequest` | `AcademicProfileResponse`        | —                    |
| `POST`   | `/api/v1/applications/bulk-update`                                             | Bulk Update Applications         | `ApplicationBulkUpdateRequest`  | `ApplicationBulkUpdateResponse`  | —                    |
| `DELETE` | `/api/v1/applications/{application_id}`                                        | Delete Application               | `-`                             | `No content`                     | —                    |
| `POST`   | `/api/v1/applications/{application_id}/archive`                                | Archive Application              | `ApplicationArchiveRequest`     | `ApplicationResponse`            | —                    |
| `GET`    | `/api/v1/applications/{application_id}/documents`                              | List Document Links              | `-`                             | `DocumentLinkResponse[]`         | —                    |
| `DELETE` | `/api/v1/applications/{application_id}/documents/{link_id}`                    | Unlink Document                  | `-`                             | `No content`                     | —                    |
| `POST`   | `/api/v1/applications/{application_id}/duplicate`                              | Duplicate Application            | `ApplicationDuplicateRequest`   | `ApplicationResponse`            | —                    |
| `GET`    | `/api/v1/applications/{application_id}/export`                                 | Export Application               | `-`                             | `ApplicationExportResponse`      | —                    |
| `GET`    | `/api/v1/applications/{application_id}/readiness`                              | Application Readiness            | `-`                             | `ApplicationReadinessResponse`   | —                    |
| `POST`   | `/api/v1/applications/{application_id}/requirements/bulk`                      | Bulk Add Requirements            | `RequirementBulkCreate`         | `RequirementResponse[]`          | —                    |
| `POST`   | `/api/v1/applications/{application_id}/requirements/reorder`                   | Reorder Requirements             | `RequirementReorderRequest`     | `RequirementResponse[]`          | —                    |
| `POST`   | `/api/v1/applications/{application_id}/requirements/{requirement_id}/validate` | Validate Requirement             | `RequirementValidateRequest`    | `RequirementResponse`            | —                    |
| `POST`   | `/api/v1/applications/{application_id}/submit`                                 | Submit Application               | `ApplicationSubmitRequest`      | `ApplicationResponse`            | —                    |
| `POST`   | `/api/v1/applications/{application_id}/tasks/bulk`                             | Bulk Add Tasks                   | `TaskBulkCreate`                | `TaskResponse[]`                 | —                    |
| `POST`   | `/api/v1/applications/{application_id}/tasks/reorder`                          | Reorder Tasks                    | `TaskReorderRequest`            | `TaskResponse[]`                 | —                    |
| `POST`   | `/api/v1/billing/checkout`                                                     | Create Checkout                  | `CheckoutRequest`               | `CheckoutResponse`               | —                    |
| `POST`   | `/api/v1/billing/customer-portal`                                              | Create Customer Portal           | `CustomerPortalRequest`         | `CustomerPortalResponse`         | —                    |
| `GET`    | `/api/v1/billing/entitlements`                                                 | Get Entitlements                 | `-`                             | `EntitlementResponse`            | —                    |
| `GET`    | `/api/v1/billing/plans`                                                        | List Plans                       | `-`                             | `PlanOption[]`                   | —                    |
| `GET`    | `/api/v1/billing/purchases`                                                    | List Purchases                   | `-`                             | `TokenPurchaseResponse[]`        | —                    |
| `GET`    | `/api/v1/billing/subscription`                                                 | Get Subscription                 | `-`                             | `SubscriptionResponse`           | —                    |
| `POST`   | `/api/v1/billing/token-checkout`                                               | Create Token Checkout            | `TokenCheckoutRequest`          | `TokenCheckoutResponse`          | —                    |
| `GET`    | `/api/v1/billing/token-products`                                               | Get Token Products               | `-`                             | `TokenProductInfo`               | —                    |
| `GET`    | `/api/v1/billing/usage`                                                        | Get Usage                        | `-`                             | `UsageResponse`                  | period, limit, cursor |

## Phase 2 newly added operations

| Method     | Endpoint                                                                                   | Summary                        | Request schema                      | Success schema                    | Query/header inputs           |
| ---------- | ------------------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------- | --------------------------------- | ----------------------------- |
| `GET`    | `/api/v1/application-intelligence/applications/{application_id}/eligibility`             | Current Eligibility            | `-`                               | `EligibilityResponse`           | —                            |
| `GET`    | `/api/v1/application-intelligence/applications/{application_id}/eligibility/history`     | Eligibility History            | `-`                               | `EligibilityHistoryResponse`    | cursor, limit                 |
| `POST`   | `/api/v1/application-intelligence/applications/{application_id}/eligibility/recalculate` | Recalculate Eligibility        | `EligibilityRequest`              | `EligibilityResponse`           | —                            |
| `GET`    | `/api/v1/application-intelligence/imports`                                               | List Imports                   | `-`                               | `OpportunityImportListResponse` | cursor, limit                 |
| `DELETE` | `/api/v1/application-intelligence/imports/{import_id}`                                   | Delete Import                  | `-`                               | `No content`                    | —                            |
| `POST`   | `/api/v1/application-intelligence/imports/{import_id}/cancel`                            | Cancel Import                  | `-`                               | `OpportunityImportResponse`     | —                            |
| `POST`   | `/api/v1/application-intelligence/imports/{import_id}/retry`                             | Retry Import                   | `-`                               | `OpportunityImportResponse`     | —                            |
| `POST`   | `/api/v1/application-intelligence/matches`                                               | Find Matches                   | `OpportunityMatchRequest`         | `OpportunityMatchResponse`      | —                            |
| `GET`    | `/api/v1/application-intelligence/recommendations`                                       | Recommendations                | `-`                               | `RecommendationsResponse`       | —                            |
| `GET`    | `/api/v1/applications/{application_id}/collaborator-view`                                | Collaborator View              | `-`                               | `CollaboratorViewResponse`      | —                            |
| `GET`    | `/api/v1/applications/{application_id}/collaborators`                                    | List Collaborators             | `-`                               | `CollaboratorResponse[]`        | —                            |
| `POST`   | `/api/v1/applications/{application_id}/collaborators`                                    | Invite Collaborator            | `CollaboratorInvite`              | `CollaboratorResponse`          | —                            |
| `DELETE` | `/api/v1/applications/{application_id}/collaborators/{collaborator_id}`                  | Remove Collaborator            | `-`                               | `No content`                    | —                            |
| `PATCH`  | `/api/v1/applications/{application_id}/collaborators/{collaborator_id}`                  | Update Collaborator            | `CollaboratorUpdate`              | `CollaboratorResponse`          | —                            |
| `DELETE` | `/api/v1/catalogue/institutions/{institution_id}`                                        | Delete Institution             | `-`                               | `No content`                    | —                            |
| `GET`    | `/api/v1/catalogue/institutions/{institution_id}`                                        | Get Institution                | `-`                               | `InstitutionResponse`           | —                            |
| `PATCH`  | `/api/v1/catalogue/institutions/{institution_id}`                                        | Update Institution             | `InstitutionUpdate`               | `InstitutionResponse`           | —                            |
| `DELETE` | `/api/v1/catalogue/programmes/{programme_id}`                                            | Delete Programme               | `-`                               | `No content`                    | —                            |
| `GET`    | `/api/v1/catalogue/programmes/{programme_id}`                                            | Get Programme                  | `-`                               | `ProgrammeResponse`             | —                            |
| `PATCH`  | `/api/v1/catalogue/programmes/{programme_id}`                                            | Update Programme               | `ProgrammeUpdate`                 | `ProgrammeResponse`             | —                            |
| `DELETE` | `/api/v1/catalogue/scholarships/{scholarship_id}`                                        | Delete Scholarship             | `-`                               | `No content`                    | —                            |
| `GET`    | `/api/v1/catalogue/scholarships/{scholarship_id}`                                        | Get Scholarship                | `-`                               | `ScholarshipResponse`           | —                            |
| `PATCH`  | `/api/v1/catalogue/scholarships/{scholarship_id}`                                        | Update Scholarship             | `ScholarshipUpdate`               | `ScholarshipResponse`           | —                            |
| `POST`   | `/api/v1/collaborator-invitations/{token}/accept`                                        | Accept Collaborator Invitation | `-`                               | `CollaboratorAcceptResponse`    | —                            |
| `GET`    | `/api/v1/saved-searches`                                                                 | List Saved Searches            | `-`                               | `SavedSearchResponse[]`         | —                            |
| `POST`   | `/api/v1/saved-searches`                                                                 | Create Saved Search            | `SavedSearchCreate`               | `SavedSearchResponse`           | —                            |
| `DELETE` | `/api/v1/saved-searches/{saved_search_id}`                                               | Delete Saved Search            | `-`                               | `No content`                    | —                            |
| `GET`    | `/api/v1/saved-searches/{saved_search_id}`                                               | Get Saved Search               | `-`                               | `SavedSearchResponse`           | —                            |
| `PATCH`  | `/api/v1/saved-searches/{saved_search_id}`                                               | Update Saved Search            | `SavedSearchUpdate`               | `SavedSearchResponse`           | —                            |
| `POST`   | `/api/v1/saved-searches/{saved_search_id}/run`                                           | Run Saved Search               | `-`                               | `SavedSearchRunResponse`        | —                            |
| `GET`    | `/api/v1/share/{token}`                                                                  | Get Shared Document            | `-`                               | `SharedDocumentResponse`        | X-Share-Passcode              |
| `POST`   | `/api/v1/share/{token}/comments`                                                         | Add Shared Comment             | `SharedCommentCreate`             | `WritingCommentResponse`        | X-Share-Passcode              |
| `DELETE` | `/api/v1/writing-studio/comments/{comment_id}`                                           | Delete Comment                 | `-`                               | `No content`                    | —                            |
| `PATCH`  | `/api/v1/writing-studio/comments/{comment_id}`                                           | Update Comment                 | `WritingCommentUpdate`            | `WritingCommentResponse`        | —                            |
| `DELETE` | `/api/v1/writing-studio/documents/{document_id}`                                         | Delete Document                | `-`                               | `No content`                    | —                            |
| `GET`    | `/api/v1/writing-studio/documents/{document_id}/analyses`                                | List Analyses                  | `-`                               | `QualityAnalysisListResponse`   | cursor, limit                 |
| `GET`    | `/api/v1/writing-studio/documents/{document_id}/comments`                                | List Comments                  | `-`                               | `WritingCommentListResponse`    | cursor, limit                 |
| `POST`   | `/api/v1/writing-studio/documents/{document_id}/comments`                                | Create Comment                 | `WritingCommentCreate`            | `WritingCommentResponse`        | —                            |
| `POST`   | `/api/v1/writing-studio/documents/{document_id}/detach/{application_id}`                 | Detach Document                | `-`                               | `WritingDocumentResponse`       | —                            |
| `POST`   | `/api/v1/writing-studio/documents/{document_id}/duplicate`                               | Duplicate Document             | `WritingDocumentDuplicateRequest` | `WritingDocumentResponse`       | —                            |
| `GET`    | `/api/v1/writing-studio/documents/{document_id}/generation-runs`                         | List Generation Runs           | `-`                               | `GenerationRunResponse[]`       | —                            |
| `GET`    | `/api/v1/writing-studio/documents/{document_id}/preview`                                 | Preview Document               | `-`                               | `WritingPreviewResponse`        | —                            |
| `GET`    | `/api/v1/writing-studio/documents/{document_id}/share-links`                             | List Share Links               | `-`                               | `ShareLinkResponse[]`           | —                            |
| `POST`   | `/api/v1/writing-studio/documents/{document_id}/share-links`                             | Create Share Link              | `ShareLinkCreate`                 | `ShareLinkCreateResponse`       | —                            |
| `DELETE` | `/api/v1/writing-studio/documents/{document_id}/share-links/{share_link_id}`             | Revoke Share Link              | `-`                               | `No content`                    | —                            |
| `GET`    | `/api/v1/writing-studio/generation-runs/{run_id}`                                        | Get Generation Run             | `-`                               | `GenerationRunResponse`         | —                            |
| `POST`   | `/api/v1/writing-studio/generation-runs/{run_id}/cancel`                                 | Cancel Generation Run          | `-`                               | `GenerationRunResponse`         | —                            |
| `POST`   | `/api/v1/writing-studio/generation-runs/{run_id}/retry`                                  | Retry Generation Run           | `-`                               | `GenerationRunResponse`         | —                            |
| `DELETE` | `/api/v1/writing-studio/stories/{story_id}`                                              | Delete Story                   | `-`                               | `No content`                    | —                            |
| `GET`    | `/api/v1/writing-studio/stories/{story_id}`                                              | Get Story                      | `-`                               | `StoryResponse`                 | —                            |
| `PATCH`  | `/api/v1/writing-studio/stories/{story_id}`                                              | Update Story                   | `StoryUpdate`                     | `StoryResponse`                 | —                            |
| `GET`    | `/api/v1/writing-studio/templates`                                                       | List Templates                 | `-`                               | `WritingTemplateResponse[]`     | documentType, applicationType |
| `GET`    | `/api/v1/writing-studio/templates/{template_id}`                                         | Get Template Detail            | `-`                               | `WritingTemplateResponse`       | —                            |

## Phase 3 newly added operations

| Method     | Endpoint                                                        | Summary                         | Request schema                    | Success schema                          | Query/header inputs                  |
| ---------- | --------------------------------------------------------------- | ------------------------------- | --------------------------------- | --------------------------------------- | ------------------------------------ |
| `GET`    | `/api/v1/academic-interviews`                                 | List Interviews                 | `-`                             | `AcademicInterviewListResponse`       | cursor, limit                        |
| `GET`    | `/api/v1/academic-interviews/{interview_id}`                  | Get Interview                   | `-`                             | `AcademicInterviewResponse`           | —                                   |
| `POST`   | `/api/v1/academic-interviews/{interview_id}/audio/complete`   | Interview Audio Complete        | `InterviewAudioCompleteRequest` | `InterviewAudioResponse`              | —                                   |
| `POST`   | `/api/v1/academic-interviews/{interview_id}/audio/upload-url` | Interview Audio Upload Url      | `InterviewAudioUploadRequest`   | `InterviewAudioUploadResponse`        | —                                   |
| `GET`    | `/api/v1/academic-interviews/{interview_id}/audio/{audio_id}` | Get Interview Audio             | `-`                             | `InterviewAudioResponse`              | —                                   |
| `POST`   | `/api/v1/academic-interviews/{interview_id}/cancel`           | Cancel Interview                | `-`                             | `AcademicInterviewResponse`           | —                                   |
| `POST`   | `/api/v1/academic-interviews/{interview_id}/complete`         | Complete Interview              | `-`                             | `AcademicInterviewResponse`           | —                                   |
| `GET`    | `/api/v1/academic-interviews/{interview_id}/report`           | Interview Report                | `-`                             | `InterviewReportResponse`             | —                                   |
| `GET`    | `/api/v1/academic-interviews/{interview_id}/turns`            | List Interview Turns            | `-`                             | `InterviewTurnResponse[]`             | —                                   |
| `GET`    | `/api/v1/academic-references/{request_id}`                    | Get Reference                   | `-`                             | `AcademicReferenceResponse`           | —                                   |
| `PATCH`  | `/api/v1/academic-references/{request_id}`                    | Update Reference                | `AcademicReferenceUpdate`       | `AcademicReferenceResponse`           | —                                   |
| `POST`   | `/api/v1/academic-references/{request_id}/cancel`             | Cancel Reference                | `-`                             | `AcademicReferenceResponse`           | expected_version                     |
| `GET`    | `/api/v1/academic-references/{request_id}/certificate`        | Reference Certificate           | `-`                             | `-`                                   | —                                   |
| `GET`    | `/api/v1/academic-references/{request_id}/download`           | Reference Download              | `-`                             | `string`                              | —                                   |
| `GET`    | `/api/v1/academic-references/{request_id}/events`             | Reference Events                | `-`                             | `ReferenceEventListResponse`          | cursor, limit                        |
| `POST`   | `/api/v1/academic-references/{request_id}/remind`             | Remind Reference                | `-`                             | `AcademicReferenceResponse`           | —                                   |
| `POST`   | `/api/v1/academic-references/{request_id}/resend`             | Resend Reference                | `-`                             | `AcademicReferenceResponse`           | —                                   |
| `GET`    | `/api/v1/admin/catalogue/{kind}/pending`                      | List Pending Catalogue          | `-`                             | `CursorPage_CatalogueModerationItem_` | cursor, limit                        |
| `POST`   | `/api/v1/admin/catalogue/{kind}/{item_id}/approve`            | Approve Catalogue Item          | `-`                             | `CatalogueModerationItem`             | —                                   |
| `POST`   | `/api/v1/admin/catalogue/{kind}/{item_id}/merge`              | Merge Catalogue Item            | `CatalogueMergeRequest`         | `CatalogueModerationItem`             | —                                   |
| `POST`   | `/api/v1/admin/catalogue/{kind}/{item_id}/reject`             | Reject Catalogue Item           | `CatalogueRejectRequest`        | `No content`                          | —                                   |
| `GET`    | `/api/v1/admin/feature-flags`                                 | List Feature Flags              | `-`                             | `FeatureFlagSummary[]`                | —                                   |
| `GET`    | `/api/v1/admin/operations`                                    | List Operations                 | `-`                             | `CursorPage_OperationSummary_`        | type, status, cursor, limit          |
| `GET`    | `/api/v1/admin/operations/{operation_id}`                     | Get Operation                   | `-`                             | `OperationDetail`                     | —                                   |
| `POST`   | `/api/v1/admin/operations/{operation_id}/cancel`              | Cancel Operation                | `-`                             | `OperationDetail`                     | —                                   |
| `POST`   | `/api/v1/admin/operations/{operation_id}/retry`               | Retry Operation                 | `-`                             | `OperationDetail`                     | —                                   |
| `POST`   | `/api/v1/admin/queues/{queue_name}/redrive`                   | Redrive Queue                   | `DlqRedriveRequest`             | `DlqRedriveResponse`                  | —                                   |
| `GET`    | `/api/v1/admin/references/{request_id}/events`                | Inspect Reference Events        | `-`                             | `CursorPage_ReferenceEventSummary_`   | cursor, limit                        |
| `POST`   | `/api/v1/admin/reminders/run-due`                             | Run Due Reminders               | `-`                             | `object`                              | —                                   |
| `GET`    | `/api/v1/admin/users/search`                                  | Search User                     | `-`                             | `UserSearchResult`                    | email, user_id                       |
| `GET`    | `/api/v1/admin/users/{user_id}/entitlement`                   | Inspect Entitlement             | `-`                             | `EntitlementResponse`                 | —                                   |
| `GET`    | `/api/v1/admin/users/{user_id}/usage-ledger`                  | Inspect Usage Ledger            | `-`                             | `UsageResponse`                       | limit, cursor                        |
| `DELETE` | `/api/v1/calendar-feed/token`                                 | Revoke Calendar Feed Token      | `-`                             | `No content`                          | —                                   |
| `POST`   | `/api/v1/calendar-feed/token`                                 | Create Calendar Feed Token      | `-`                             | `CalendarFeedTokenResponse`           | —                                   |
| `GET`    | `/api/v1/calendar-feed/{token}.ics`                           | Calendar Feed                   | `-`                             | `-`                                   | —                                   |
| `GET`    | `/api/v1/notification-preferences`                            | Get Notification Preferences    | `-`                             | `NotificationPreferencesResponse`     | —                                   |
| `PUT`    | `/api/v1/notification-preferences`                            | Update Notification Preferences | `NotificationPreferencesUpdate` | `NotificationPreferencesResponse`     | —                                   |
| `GET`    | `/api/v1/notifications`                                       | List Notifications              | `-`                             | `NotificationListResponse`            | unreadOnly, cursor, limit            |
| `POST`   | `/api/v1/notifications/read-all`                              | Mark All Notifications Read     | `-`                             | `No content`                          | —                                   |
| `GET`    | `/api/v1/notifications/unread-count`                          | Unread Count                    | `-`                             | `UnreadCountResponse`                 | —                                   |
| `POST`   | `/api/v1/notifications/{notification_id}/read`                | Mark Notification Read          | `-`                             | `NotificationResponse`                | —                                   |
| `GET`    | `/api/v1/reminders`                                           | List Reminders                  | `-`                             | `ReminderListResponse`                | aggregateType, status, cursor, limit |
| `POST`   | `/api/v1/reminders`                                           | Create Reminder                 | `ReminderCreate`                | `ReminderResponse`                    | —                                   |
| `DELETE` | `/api/v1/reminders/{reminder_id}`                             | Delete Reminder                 | `-`                             | `No content`                          | —                                   |
| `GET`    | `/api/v1/reminders/{reminder_id}`                             | Get Reminder                    | `-`                             | `ReminderResponse`                    | —                                   |
| `PATCH`  | `/api/v1/reminders/{reminder_id}`                             | Update Reminder                 | `ReminderUpdate`                | `ReminderResponse`                    | —                                   |
| `POST`   | `/api/v1/reminders/{reminder_id}/snooze`                      | Snooze Reminder                 | `ReminderSnoozeRequest`         | `ReminderResponse`                    | —                                   |

# Appendix B — Existing operations with changed contracts

| Method   | Endpoint                             | Required frontend migration                                                                                         |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/academic-references`      | Migrate to`AcademicReferenceListResponse`; add status and cursor pagination.                                      |
| `POST` | `/api/v1/academic-references`      | Response is now`AcademicReferenceResponse`; remove invitation-token handling.                                     |
| `GET`  | `/api/v1/applications`             | Migrate array consumers to`ApplicationListResponse`; implement all new filters, cursor and sort.                  |
| `GET`  | `/api/v1/applications/board`       | Add supported board filters.                                                                                        |
| `GET`  | `/api/v1/catalogue/institutions`   | Migrate to`InstitutionListResponse`; add country/verified filters and cursor pagination.                          |
| `GET`  | `/api/v1/catalogue/programmes`     | Migrate to`ProgrammeListResponse`; add search/country/degree/field filters and cursor pagination.                 |
| `GET`  | `/api/v1/catalogue/scholarships`   | Migrate to`ScholarshipListResponse`; add search/institution/country/field/verified filters and cursor pagination. |
| `GET`  | `/api/v1/writing-studio/documents` | Support`includeArchived`; response remains an array.                                                              |
| `GET`  | `/api/v1/writing-studio/stories`   | Migrate to`StoryListResponse`; add category/sensitivity/search and cursor pagination.                             |
| `GET`  | `/metric`                          | Deprecated; remove usage and use`/metrics` for operational tooling only.                                          |

# Appendix C — Deliverables by phase

Each phase must deliver:

```text
docs/frontend/phase-N-start-review.md
docs/frontend/phase-N-completion-report.md
docs/frontend/api-delta-matrix.md
docs/frontend/contract-gap-log.md
docs/frontend/eliteresume-reuse-map.md
docs/frontend/architecture-decisions.md
```

The final API delta matrix must contain every operation in Appendix A and every changed operation in Appendix B.
