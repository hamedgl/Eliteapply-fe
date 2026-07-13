# Phase 2 completion report

Date: 2026-07-13

## Outcome

Phase 2 is implemented against the corrected `docs/api/openapi.json`. The frontend now covers the discovery-to-writing workflow, import and eligibility lifecycle, reviewer collaboration, authenticated comments, and secure public sharing described in `docs/eliteapply_fe_delta_prompt.md`.

The generated contract was validated before implementation:

- 171 paths
- 220 operations
- 185 schemas
- A fresh OpenAPI generation in `/tmp` was byte-identical to `src/generated/api/schema.ts`.

The Phase 1 completion report was checked against the code, current contract, generated types, routes and test coverage before Phase 2 work began. That validation is recorded in `docs/frontend/phase-2-start-review.md`.

## Implemented scope

### Catalogue and discovery

- Added cursor-paginated institution, programme and scholarship lists.
- Added URL-backed search, country, verification, degree and field filters where supported by the API.
- Added detail routes at `/app/catalogue/:kind/:id`.
- Added clear canonical/private badges, provenance, verification date and safe external source links.
- Added create, edit and delete controls for private records. Edit/delete are shown only for an owning user or administrator; the backend remains authoritative.
- Added application creation links that prefill the application title, type and catalogue relation.
- Added saved-search creation, listing, rename, deletion and run-now results.
- Added matches and recommendations with the backend disclaimer kept visible and no admission-probability language.

### Import and eligibility lifecycle

- URL imports no longer require pasted raw text.
- Pasted text and PDF-text modes still enforce source text.
- Added cursor-paginated import history, state polling, retry, cancel and delete actions.
- Added an extracted-field correction editor with per-field confidence presentation and explicit confirmation.
- Added current eligibility, history and explicit recalculation in the application workspace.
- Eligibility recalculation invalidates application readiness and dashboard queries.

### Writing Studio

- Added template filtering by document/application type and template-detail guidance in the creation flow.
- Added template ID, academic CV mode, word limit and character limit handling.
- Added document attachment/detachment, duplicate, archive filtering and delete actions.
- Added API-rendered preview through an allowlist sanitizer and a sandboxed iframe.
- Replaced document polling with generation-run lifecycle state.
- Active runs resume from generation history after reload/navigation.
- Polling uses bounded exponential backoff, stops at terminal states and pauses while the page is hidden.
- Success refreshes the document, revisions, usage and entitlements.
- Added cancel/retry controls and retry lineage display.
- Added entitlement-aware generation gating while preserving server authority.
- Added current analysis, analysis history, revision history and restore.
- Exports use the defensive download helper for TXT, DOCX and PDF.

### Stories and collaboration

- Added cursor pagination plus category, sensitivity and search filters to Story Bank.
- Added create, version-aware edit and delete actions with full story detail fields.
- Added application collaborator list, invite, role update and removal.
- Added viewer/commenter read-only application rendering from the collaborator-view response; advisor editing continues through server-authorized workspace requests.
- Added invitation acceptance that survives authentication without placing the invitation token in a query string.
- Added general and character-offset anchored comments, optional revision association, edit/delete and resolve/reopen.
- Added share-link creation, active-link management, copy-on-create and revocation.
- Added the public `/share/:token` route with passcode-only request headers, a noindex directive, sandboxed HTML and comment forms only for comment-scoped links.

### Navigation and presentation

- Added Catalogue, Saved searches and Story Bank to the authenticated navigation.
- Added responsive Phase 2 layouts that reuse the existing Source Serif/DM Sans, cool-white, cobalt Academic Compass identity.
- Fixed checkbox/radio sizing globally after desktop/mobile visual QA exposed inherited full-width controls.
- Moved the two supplied landing illustrations out of the repository root:
  - `src/assets/illustrations/application-path.png`
  - `src/assets/illustrations/connected-workspace.png`

## API coverage

All Phase 2 endpoint families from the prompt now have frontend adapters and a user-facing surface:

| Family | Frontend coverage |
| --- | --- |
| Catalogue institutions/programmes/scholarships | list, filters, cursor, detail, create, update, delete |
| Saved searches | list, detail adapter, create, update, delete, run |
| Matches/recommendations | match form, results, disclaimer, application CTA |
| Opportunity imports | create, list, detail, confirm, retry, cancel, delete |
| Eligibility | current, history, recalculate, readiness invalidation |
| Writing templates/documents | template list/detail, create, edit, attach/detach, duplicate, delete, preview |
| Generation runs | start, history, detail polling, cancel, retry, resume |
| Analyses/revisions/exports | current/history, restore, defensive downloads |
| Stories | filtered cursor list, create, detail adapter, version-aware update, delete |
| Collaborators | list, invite, update, remove, accept, permission view |
| Comments/share | comment lifecycle, share lifecycle, passcode public view/comment |

## Design and engineering decisions

The requested Impeccable, Ponytail and UI/UX Pro Max guidance was applied as follows:

- No new runtime dependency was introduced. React Query, native URL state, DOMParser, sandboxed iframes and existing helpers cover the required behavior.
- The UI/UX search recommended micro-interactions and an editorial interface. The motion/accessibility advice was retained, but its suggested pink/black palette and Lora/Raleway pairing were rejected because they conflict with the established EliteApply cobalt and Source Serif/DM Sans identity.
- New screens use list/detail and split-workspace patterns instead of repeating generic card grids.
- Security-critical states use explicit language: private records are not verified, recommendation scores are not admission probability, confidence is not certainty, and writing analysis is guidance only.

## Deliberate changes from the prompt

- The corrected OpenAPI exposes both the older eligibility POST and the newer explicit `/eligibility/recalculate` operation. The UI uses the explicit recalculation route; the older adapter remains for compatibility with existing Phase 1 code.
- Collaborator invitation tokens are preserved in `sessionStorage` for the single authentication handoff. This avoids query strings, analytics and persistent application logs, and the token is removed immediately after acceptance.
- API preview HTML is not injected into the application DOM. It is reduced to an allowlisted subset, placed in a complete preview document and rendered in an iframe with an empty sandbox.
- Existing Writing Studio document arrays remain unpaginated because the current OpenAPI still returns arrays for those two list operations. The query/adaptor boundaries remain isolated for a later contract migration.
- Catalogue authorization is not self-describing in the contract. The UI exposes edits only for private records owned by the current user or an administrator, while every mutation still relies on backend authorization.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | Pass — 6 files, 21 tests |
| `npm run build` | Pass — 1,780 modules transformed |
| `git diff --check` | Pass |
| Phase 2 Chromium E2E | Pass — 3/3 |
| Desktop catalogue visual QA | Pass at 1280×720 |
| Public share visual/security QA | Pass at 1440×1414 capture |
| Mobile application regression | Pass at 390×844 |

The Browser plugin was not available, so rendered QA used the repository Playwright workflow with `/usr/bin/google-chrome`. The sandbox initially blocked Chrome's crash handler; the same suite passed outside the sandbox. Screenshots were kept outside the repository in `/tmp`.

## Phase 3 heads-up

Phase 3 should start by validating this report against the working tree and corrected OpenAPI, just as Phase 2 validated Phase 1. Highest-risk areas are:

1. Upgrade academic references from the current partial screens to all create modes, lifecycle actions, public referee decisions, events, verification and downloads. The new contract no longer returns invitation tokens.
2. Replace the current minimal interview screen with history, session resume, server-owned questions, completion/reporting and asynchronous recorded audio uploads. There is no realtime voice or TTS API.
3. Add notifications, preferences, reminders, timezone-safe recurrence and calendar-feed token management.
4. Expand the admin console with strict `is_admin` route gating and per-request 403 handling.
5. Add production hardening: route recovery, analytics scrubbing, feature flags, sensitive-field error reporting, and complete golden-path E2E coverage.

Do not start Phase 3 by redesigning the established app shell or replacing the current OpenAPI-generated types. Preserve token redaction, mutation IDs, defensive downloads, cursor helpers and the current Academic Compass visual system.
