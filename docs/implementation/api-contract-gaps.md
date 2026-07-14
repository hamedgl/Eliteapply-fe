# API contract gaps

## Phase 1

- Billing, plans, checkout, subscription and AI quota endpoints are absent. Status: `blocked_backend`; UI is hidden and no EliteResume endpoint is called. Needed: product-scoped plan catalogue, entitlement, subscription, checkout/portal and usage/quota contracts plus explicit EliteApply capability.
- The platform identity and feature-flag response objects are open-ended. They are consumed only as guarded records until concrete child schemas are published.
- Dashboard deadline children are open-ended. Phase 1 counts guarded objects but does not infer dates, labels or links. A typed deadline item schema is needed for Phase 2 rendering.
- Onboarding exposes completed steps, next step and completeness, but no mutation endpoint. Phase 1 renders backend-driven progress through the dashboard and cannot mark steps itself.
- Legal copy/version approval was not supplied. Routes and typed version configuration exist, but production legal text remains a launch dependency.
- Sentry DSN/project ownership and approved PII policy were not supplied; telemetry activation remains configuration work.

No sanitized live-user payloads were captured.

## Phase 2

- `DashboardResponse.upcoming_deadlines` remains open-ended; Phase 2 does not invent deadline item fields.
- Academic profile `sections`, `provenance`, and version `snapshot` are open-ended. The editor preserves unknown keys and exposes a conservative known-section registry; richer field-specific editors need published child schemas or sanitized observed fixtures.
- `TaskResponse.status` is unconstrained while `TaskUpdate.status` enumerates four states. The UI renders unknown response values safely and does not assume response values are exhaustive.
- Opportunity import status is an unconstrained string. Polling treats `completed`, `complete`, `ready`, `failed`, and `partial` as observed terminal candidates and remains bounded by a 10-second maximum interval; the backend should publish a status enum.
- Opportunity extraction fields, confidence, eligibility findings/components, catalogue `raw_source`, and audit `event_metadata` are open-ended. Adapters render scalar/record summaries and never branch on unguarded child fields.
- No academic profile restore endpoint exists; history is intentionally read-only.
- No application deletion or document unlink endpoint exists; controls are intentionally absent.
- Academic document signed uploads support both PUT and form-style methods. Backend storage CORS and exact form-field behavior require live-environment verification.
- No retrieval endpoint exists for eligibility analyses. Results remain query/local navigation state only and are not presented as historical records.

## Phase 3

- Writing generation returns `202 GenerationRunResponse` but no generation-run GET/status endpoint exists. The UI shows accepted/current returned status; durable polling and refresh recovery are `blocked_backend`.
- Writing `content`, `evidence_map`, quality scores/findings/warnings, revision AI insertions, interview questions/context/scoring/feedback/warnings, referee public payloads and admin readiness payloads are open-ended. All are guarded; richer branching needs child schemas.
- Story edit/delete and writing-document delete do not exist; controls are absent.
- Billing/quota remains absent, so generation shows typed 429 errors without fabricated balances.
- Approved CSP, Sentry ownership/source-map credentials, legal text, production CORS and live sanitized fixtures remain launch dependencies.

## Unused endpoint completion

- Calendar feed create/revoke has no authenticated read operation, so an existing secret cannot be redisplayed after reload.
- Signed upload form fields are generated as unknown values; the frontend accepts string/Blob values and rejects other shapes without rewriting them.
- Cross-origin Blob downloads depend on provider CORS; direct signed navigation remains the reliable default.
- Health, readiness, Prometheus, and deprecated metrics-alias consumers remain excluded by explicit user scope and need a platform-operations owner.
