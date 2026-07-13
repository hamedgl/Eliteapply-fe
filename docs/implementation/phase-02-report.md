# Phase 02 report — Academic profile, applications, documents and intelligence

## 1. Objective and status

Phase 2 is **conditionally complete**. The operational academic application core now exists as contract-backed, lazy-loaded routes. Recommendation: **`conditionally_ready`** for Phase 3 after the incomplete mutation controls and live-backend verification items in section 17 are accepted or closed.

## 2. Phase Start Review

Phase 1 was `conditionally_ready`: memory-only auth, single-flight refresh, strict generated types and the academic shell passed unit/build checks, while browser/accessibility, resend/set-password, legal and telemetry work remained. Phase 2 preserved that session model. The stored OpenAPI remains EliteApply API v0.1.0 with 73 paths; generated types were verified before implementation. Billing remains blocked. Dashboard deadlines and several Phase 2 child objects remain intentionally open-ended. The main change from the Phase 1 plan is that the application drawer concept became a routed cohesive workspace to avoid duplicated server state and preserve mobile usability.

## 3. Routes delivered

- `/app/applications` — accessible board/list, filters and create flow
- `/app/applications/:id` — overview, requirements, tasks, linked documents, activity and readiness
- `/app/applications/import` — opportunity source extraction, polling, review and confirmation
- `/app/academic-profile` — forward-compatible profile and read-only version history
- `/app/documents` — document vault and signed upload/download/delete
- `/app/catalogue` — debounced, abortable institution catalogue search

## 4. Reused unchanged

Phase 1 app shell, session store, request client, query provider, auth routes, error model and design tokens remain in use without domain coupling.

## 5. Extracted/shared

Stable Phase 2 query keys, exact API domain modules, board/date adapters and the signed upload helper now form reusable product-local infrastructure. No cross-repository package was created.

## 6. Adapted/rebuilt

The EliteResume job-tracker idea was rebuilt around the EliteApply application model and all 17 backend stages. The academic profile preserves unknown sections rather than reusing employment forms. Upload architecture was adapted to both signed PUT and signed form methods. ATS-like analysis language was replaced by readiness/eligibility with the mandatory backend disclaimer.

## 7. Endpoint coverage

`api-coverage.md` contains the full method/path/module/screen/test table. All Phase 2 endpoint families have typed domain methods. Primary GET/create/upload/import/eligibility flows have UI; some requirement/task update/delete, link-document, and catalogue create controls remain API-ready but not fully surfaced and are marked `implemented_unverified`.

## 8. API mismatches and undocumented behavior

No generated wire-name mismatch was found. Exact `institutionId`, UUID mutation IDs and `expected_version` are preserved. Open-ended status/findings/metadata behavior and absent restore/unlink/delete/retrieval operations are recorded in `api-contract-gaps.md`. No production user payload was captured.

## 9. Security and privacy

- Existing memory-only token and correlation-ID behavior was preserved.
- Signed storage URLs are called directly without EliteApply authorization headers.
- Storage keys are never displayed in normal document UI.
- Upload MIME and backend maximum-size checks occur before registration.
- Malware state is shown explicitly and never represented as ready implicitly.
- Mutation IDs are created once per create/import form and kept stable across that action’s retries.
- Eligibility/import/profile open objects are rendered defensively rather than passed into unsafe markup.
- Application deletion and document unlink controls do not exist because the API does not define them.

## 10. Accessibility and responsive work

Board movement has a labelled native select per card, so it is keyboard/touch operable without drag-and-drop. Board rails intentionally scroll horizontally. A list/table alternative is included. Dialog, filters, tabs, upload controls, combobox semantics, status/error regions and focus-visible states are present. Mobile QA at 390×844 verified the compact header, filters, horizontal board, cards and navigation trigger. A dedicated axe scan remains deferred.

## 11. Tests and results

- `npm test`: **3 files, 6 tests passed**.
- Added board malformed-payload coverage, signed PUT + register coverage and unsupported-file preflight rejection.
- Phase 1 token storage, single-flight refresh and dashboard guard tests remain green.
- `PW_EXECUTABLE_PATH=/usr/bin/google-chrome npx playwright test --project=chromium`: **1 test passed** after sandbox escalation; desktop/mobile render and keyboard focus checked.

## 12. Build/typecheck/lint

- `npm run typecheck`: passed with strict TypeScript.
- `npm run build`: passed; 1,757 modules transformed.
- Phase 2 routes are lazy chunks: catalogue 1.45 kB, import 2.99 kB, profile 4.05 kB, documents 4.47 kB, workspace 8.05 kB and applications 8.35 kB before gzip.
- Main JS: 360.17 kB / 113.41 kB gzip; CSS: 15.72 kB / 3.90 kB gzip.
- `npm run lint` remains the repository’s strict TypeScript alias; no separate style linter exists.

## 13. Performance

The React best-practices pass introduced route-level lazy loading and narrow query invalidation. Board filtering is derived with `useMemo`; opportunity polling cancels on effect cleanup and caps the interval. No domain resource is duplicated in a global client store.

## 14. Feature flags

Applications, Academic Profile and Documents navigation are enabled as Phase 2 routes. Writing Studio, References and Interview Practice remain visibly locked for Phase 3. Billing remains hidden/blocked. API authorization remains authoritative.

## 15. Deviations

- The concept’s permanent right drawer was replaced with a routed workspace; evidence and rationale are in `decision-log.md`.
- Native select movement is complete; pointer drag-and-drop is not added because accessible movement is the primary requirement.
- Institution search UI exists, but application creation currently does not embed the async catalogue selectors.
- Some API mutation methods are ready but their full update/delete/link controls are deferred, as listed below.
- Automated axe, offline E2E, 409 E2E and live production API mutations were not executed.

## 16. Changed assumptions

Task update exposes an enum while task response status is open-ended. Import status is also open-ended. These are now treated defensively and documented instead of hardcoded as exhaustive. The actual board contract has typed application arrays per open-ended column map, allowing a stage registry adapter.

## 17. Known defects, deferred work and debt

- Embed institution/programme/scholarship async comboboxes and user-created-entry flows into application create/edit.
- Add application metadata edit form beyond stage movement, including explicit 409 compare/recovery dialog.
- Surface requirement/task update and delete controls with accessible confirmation dialogs.
- Add document attachment UI in the application workspace; the exact API method already exists.
- Improve form-level mapping of normalized 422 fields.
- Replace native `confirm()` for document deletion with the shared accessible dialog primitive.
- Add upload progress/cancellation UI beyond request cancellation support.
- Add opportunity correction editors instead of confirming all extracted fields unchanged.
- Add full list filters/sorting, board pointer drag enhancement, and deadline urgency calculations.
- Add axe/offline/422/409 E2E and sanitized live-backend fixtures.
- Phase 1 resend/set-password/legal/Sentry debt remains outstanding.

## 18. Migration/configuration

Run `npm install` because `@playwright/test` was added for browser QA. Existing Vite environment settings are unchanged. Storage hosts must permit browser PUT/form uploads and downloads. Run `npm run api:generate` after any OpenAPI change.

## 19. Visual evidence and fidelity ledger

- Accepted concept: `docs/design/phase-02-applications-concept.png`.
- Desktop render: `docs/design/phase-02-applications-render.png` at 1240×900.
- Mobile render: `docs/design/phase-02-applications-mobile.png` at 390×844.
- Browser plugin was unavailable; Playwright Chromium was the fallback.
- `view_image` inspected all three in one QA pass.

Comparison points: (1) Applications heading/copy/action match the allowed first-viewport content; (2) white/cool-gray/navy/cobalt palette matches; (3) persistent sidebar and selected state match; (4) filters and Board/List switch preserve hierarchy; (5) horizontal stage rail anatomy and empty columns match; (6) card title/type/deadline/priority and move control match the required information; (7) mobile keeps full-size controls and horizontal board rather than compressing it. No unapproved eyebrow/badge copy was added. Intentional deviations: routed workspace instead of permanent drawer, requirements/task counts omitted from board cards because the board API does not return them, and institution names omitted because the application response provides IDs without resolved institution data.

The implementation is faithfully verified against the concept within the real API’s information limits. No fixable material mismatch remains on the tested board route.

## 20. Recommendation

**`conditionally_ready`**. Phase 3 may start after reading this report, but Phase 2 should not be considered production-complete until the mutation/link/edit controls and live-backend/accessibility verification in section 17 are addressed or explicitly accepted. Stop here; do not begin Phase 3 automatically.
