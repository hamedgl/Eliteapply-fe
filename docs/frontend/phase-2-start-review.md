# Phase 2 start review

Date: 2026-07-13  
Branch: `main`  
Starting commit: `1867726`  
Working state: Phase 1 changes are present but not committed.

## 1. Runtime and architecture

- React 19 and Vite 6 with React Router 7 lazy routes.
- TanStack Query 5 owns server state; Zustand remains limited to the in-memory auth session.
- Central `apiRequest` transport provides bearer auth, one refresh retry, correlation IDs and normalized errors.
- Native forms/FormData are the dominant form pattern; React Hook Form and Zod remain installed but are not required for Phase 2.
- Vitest, Testing Library and Playwright provide unit and browser coverage.

## 2. Generated contract

- Contract: `docs/api/openapi.json`.
- Generated types: `src/generated/api/schema.ts`.
- Verified counts: 171 paths, 220 operations and 185 schemas.
- A fresh `openapi-typescript` generation byte-matched the committed generated file at Phase 2 start.

## 3. Phase 1 report validation

The Phase 1 completion report was checked against the current code rather than trusted as prose:

- billing routes/provider and all nine billing adapters exist;
- profile import/delete/version detail/restore and locale/timezone fields exist;
- application cursor list, URL filters, bulk actions, readiness, submit and versioned requirement/task controls exist;
- document detail/scan/safe download/link/unlink flows exist;
- changed reference, catalogue, story and Writing Studio consumers compile against current wrappers;
- the defensive download, mutation-ID and conflict helpers are present outside generated code;
- the 171/220/185 contract counts and generated output were independently rechecked;
- Phase 1 type, unit, build and 28 Chromium results were produced in this working session.

The two supplied landing illustrations were subsequently moved from the repository root to `src/assets/illustrations`; imports and Phase 1 documentation were updated. No Phase 1 product behavior changed.

## 4. Existing Phase 2 screens

- Catalogue institution search with request cancellation and a private-entry warning.
- Opportunity import form with URL/text modes, extraction polling and basic confirmation.
- Writing library, creation form and editor with manual save, generation, analysis, revisions and exports.
- Story Bank list/create surface.
- Application workspace without collaborator management.
- No saved-search, recommendation, match, public-share or collaborator-acceptance routes yet.

## 5. EliteResume foundations being reused

No EliteResume module is imported. Phase 2 continues adapted patterns for:

- protected routing and in-memory authentication;
- central API/correlation/error transport;
- opaque cursor loading and bounded polling;
- versioned writes and 409 conflict recovery;
- server-owned entitlements for AI actions;
- defensive binary/signed-URL downloads;
- responsive tables, tabs, dialogs and public passcode/code flows.

Product copy, route names, Stripe identifiers, entitlement assumptions and source-product analytics remain excluded.

## 6. Current API coverage and mocks

- `phase2.ts` currently covers catalogue list/create and the original import/eligibility operations.
- `phase3.ts` covers the older Writing Studio editor, basic stories and references.
- Missing adapters include catalogue details/updates/deletes, saved searches, matches/recommendations, import history/actions, eligibility history/recalculate, templates/previews/generation-run lifecycle, analysis history, story detail/update/delete, collaborators, comments, share links and public share APIs.
- Playwright route interception is the integration mock convention; there is no MSW layer.

## 7. Existing assumptions

- OpenAPI is authoritative and current.
- Entitlements never derive from plan labels.
- Download payloads require runtime inspection.
- User-created catalogue records are not globally verified.
- Public passcodes/tokens must not enter URLs, analytics or error copy.
- The Academic Compass product identity remains the visual source of truth.

## 8. Assumptions invalidated by Phase 2

- Catalogue is not institution-search-only; all three domains support detail and authorized mutation operations.
- Opportunity imports are not a single transient job; history, cancellation, retry and deletion are first-class.
- Writing generation is not a blind document refresh; generation-run history is resumable, cancellable and retryable.
- Writing analysis, stories, comments and share links use cursor/detail lifecycle APIs.
- Application access is role-aware through collaborator view data, not merely authenticated versus unauthenticated.

## 9. Breaking migrations required

Phase 1 completed the response-wrapper migrations. Phase 2 must now migrate behavioral assumptions:

- send all API-supported catalogue/story filters and opaque cursors;
- treat import/generation statuses as open strings with safe terminal-state helpers;
- sanitize preview HTML before rendering;
- send share passcodes only through `X-Share-Passcode`;
- preserve collaborator invitation tokens through authentication without analytics or persistent logging;
- refresh readiness after eligibility changes and usage/entitlements after generation completion.

## 10. Accessibility, responsive and security implications

- Dense discovery filters need URL persistence, explicit labels and narrow-screen disclosure without hiding active state.
- Generated HTML cannot be injected without sanitization.
- Generation polling must pause while the page is hidden and stop at terminal states.
- Comment anchors need textual context; state cannot be color-only.
- Read-only/commenter/advisor permissions must affect controls while the backend remains authoritative.
- Public share passcodes remain in component memory and request headers only.
- Copy-link actions must never log tokens.

## 11. Exact implementation sequence

1. Add Phase 2 adapters/query keys and small shared helpers for query serialization, safe HTML and generation terminals.
2. Upgrade catalogue discovery/detail plus saved searches, matches and recommendations.
3. Upgrade import history/actions/confirmation and eligibility current/history/recalculate.
4. Upgrade Writing Studio templates, creation, attachment, preview, generation runs, analyses, revisions, stories and exports.
5. Add application collaborators and collaborator invitation acceptance.
6. Add authenticated comments/share-link management and the public share/comment route.
7. Update fixtures/tests, run contract/type/unit/build/browser checks and write all Phase 2 completion documentation.
