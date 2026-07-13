# Phase 1 start review

Date: 2026-07-13  
Branch: `main`  
Starting commit: `1867726`

## 1. Runtime and architecture

- React 19, Vite 6 and React Router 7.
- TanStack Query 5 for server state; Zustand is limited to the in-memory auth session.
- Central `apiRequest` fetch transport with bearer auth, one refresh retry, correlation IDs and normalized errors.
- React Hook Form and Zod are installed; current Phase 1 forms use native form controls and `FormData`.
- Vitest, Testing Library and Playwright provide unit and E2E coverage.

## 2. Contract state

- Generated types: `src/generated/api/schema.ts`.
- Authoritative contract supplied in `docs/api/openapi.json`: 171 paths, 220 operations and 185 schemas.
- Generated types: 1:1 regeneration from that committed source, not from the smaller public deployment snapshot.
- A preliminary check found an 88-path contract on the published backend. That deployment snapshot was incomplete for this upgrade and was discarded when the repository's correct contract was supplied.

## 3. Existing Phase 1 surfaces

- Public pricing route with honest early-access copy but no live plan catalogue.
- Application board/list, application creation and workspace tabs.
- Academic profile editor with read-only version history.
- Document vault with signed upload, registration, download and delete.
- Account profile/security/privacy settings.
- Existing loading, empty, error and responsive states across these screens.

## 4. Existing reuse and foundations

The application is independent from EliteResume and imports no EliteResume modules. Proven patterns were previously adapted for:

- in-memory OIDC session and single-flight refresh;
- protected routing and correlation-aware API transport;
- TanStack Query cache ownership;
- signed PUT/form uploads;
- responsive application board/list and accessible stage select;
- product-specific, calm academic visual language.

Career copy, routes, billing identifiers, entitlement assumptions and the source product's dark visual identity remain excluded.

## 5. Current API coverage and mocks

- `src/lib/api/phase2.ts` covers the old academic profile, applications, requirements/tasks, documents, catalogue and intelligence contract.
- Unit tests cover board normalization and signed document upload validation.
- Playwright covers the application board and academic profile editor with route-level API mocks.
- There is no MSW layer; Playwright route interception is the current integration mock convention.

## 6. Invalidated assumptions and breaking migrations

- Billing is no longer absent: the contract adds plan, subscription, entitlement, usage, checkout, portal, token-product and purchase operations.
- Document detail, scan status, current links and unlink operations are now available.
- Applications, references, catalogue and stories now use wrapper responses where specified; all direct-array consumers must migrate.
- Referee submissions now require decision, identity, relationship, authenticity and authority fields, and reference creation no longer returns a browser-visible invite token.
- Profile lifecycle, application bulk/readiness/submission and requirement/task bulk/reorder/validation operations are available and invalidate the older board-only assumptions.
- No frontend call to deprecated `/metric` exists.

## 7. Accessibility, responsive and security implications

- Billing and document actions require visible loading/error/status feedback, keyboard controls and touch-safe targets.
- Checkout and portal destinations must come only from authenticated API responses.
- Entitlements remain server-owned; plan labels must not unlock features client-side.
- Plan pricing must not be fabricated because `PlanOption` exposes no price or currency.
- Documents cannot be downloaded or linked until scan status explicitly marks them usable.
- Contract payloads, storage keys, checkout URLs and tokens must not enter analytics or logs.

## 8. Exact implementation sequence

1. Regenerate types from the authoritative 171-path contract and migrate every changed list/referee consumer.
2. Add shared cursor, conflict, mutation-ID and defensive-download utilities plus stable query keys.
3. Add billing APIs, server-owned entitlements, public plan presentation and authenticated usage/checkout/portal flows.
4. Complete profile import, versions/detail/restore/delete and locale/timezone settings.
5. Upgrade applications to URL filters, cursor list, filtered board, bulk actions, duplicate/archive/delete/export and optimistic stage moves.
6. Add readiness/submission plus bulk, reorder, validation and versioned requirement/task actions.
7. Complete document detail, scan polling, safe download and application link/unlink flows.
8. Update fixtures/tests, run contract/type/unit/build/browser checks, and write the completion/delta documentation.
