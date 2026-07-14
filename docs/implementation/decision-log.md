# Decision log

## 2026-07-13 — Independent single-product repository

The target was an empty Git repository, so EliteApply was scaffolded independently with React 19, Vite, React Router, TanStack Query and Zustand, matching the proven source stack without copying its product tree. This prevents domain imports and scattered product conditionals.

## 2026-07-13 — Contract-first generation

Downloaded the published `https://api.eliteapply.net/openapi.json`, verified title/version, preserved it at `docs/api/openapi.json`, and generated `src/generated/api/schema.ts` with `openapi-typescript`. Generated files are not hand-edited.

## 2026-07-13 — Distinct visual system

Adopted a true-white/cool-gray academic workspace with deep navy, restrained cobalt, scholarly serif headings and sans-serif UI. The source EliteResume dark executive-dossier palette was intentionally not reused. Concept: `docs/design/phase-01-dashboard-concept.png`.

## 2026-07-13 — Billing blocked

EliteApply OpenAPI has no billing/quota contract. Existing EliteResume billing is product-coupled. Billing remains unavailable until explicit backend support exists.

## 2026-07-13 — Session privacy

Access and ID tokens exist only in Zustand memory. Startup always attempts cookie-based refresh; there is no local/session storage token or session marker.

## 2026-07-13 — Phase 2 route-domain architecture

Phase 2 features are lazy route bundles with one contract module (`src/lib/api/phase2.ts`) and stable query-key factories. Server resources remain in TanStack Query; no duplicate Zustand domain stores were added.

## 2026-07-13 — Accessible board movement

Stage movement uses a native labelled select on every application card. This is the keyboard/touch alternative and the current primary mechanism; drag-and-drop may be added later only as an enhancement. Updates send the cached `expected_version`, refetch on success, and present conflict recovery copy rather than overwriting.

## 2026-07-13 — Explicit profile saves

Academic profile uses explicit save instead of autosave because the contract has version history but no concurrency field on upsert and open-ended sections must be preserved carefully.

## 2026-07-13 — Signed document protocol

The upload helper follows the three-step contract and branches on `upload_method`: exact signed PUT with content type or signed form fields plus file, followed by metadata registration. Malware status remains visible and is never equated with ready before the backend says so.

## 2026-07-13 — Routed workspace instead of permanent drawer

The accepted board concept showed an application detail drawer. The implementation uses a dedicated cohesive workspace route so requirements, tasks, documents, activity, and readiness share one query and remain usable on mobile. Cards retain direct “Open workspace” access.

## 2026-07-13 — Phase 3 explicit writing saves

Writing uses explicit version-safe saves rather than autosave. This makes `expected_version`, conflict, offline/failed and navigation-warning states observable while preserving unknown content keys.

## 2026-07-13 — Generation acknowledgement without invented polling

The contract has no generation-run retrieval endpoint. The frontend retains the returned run status and never invents percentage/progress or polling.

## 2026-07-13 — Reference secrets remain ephemeral

Invitation tokens and referee codes exist only in component memory. Reference codes use `X-Reference-Code`, never URL/query or storage. Public calls set `public:true` and do not receive bearer headers.

## 2026-07-13 — Honest interview capability

Chat, written, and voice flows follow the published session and audio contracts. Voice requires explicit consent, uses signed upload transport, and retains the recording locally when transfer fails.

## 2026-07-14 — External calendar consumption

The SPA creates, masks, copies, opens, and revokes the calendar subscription URL but never fetches or parses the ICS feed. External calendar clients are the operation consumer, and the secret remains session-only.

## 2026-07-14 — One provider-neutral signed transport

Academic documents and interview audio now use one exact-URL upload adapter for PUT or multipart POST. Signed downloads use direct safe navigation by default, with optional Blob download when CORS permits. These requests bypass the authenticated JSON client and never add bearer authentication.

## 2026-07-14 — Operational endpoints remain out of scope

The user explicitly excluded health, readiness, and monitoring APIs. They remain visible as `not-yet-implemented` in the checked usage manifest; no customer React polling, deployment script, Prometheus configuration, or deprecated `/metric` adoption was added.
