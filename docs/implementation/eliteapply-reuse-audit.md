# EliteApply reuse audit

Date: 2026-07-13. Source reviewed: `/home/hamed/CV-AI-AI-frontend`. Reuse was selective; EliteApply is an independent application and does not import EliteResume domain features.

| Module / concern | Decision | Evidence and EliteApply boundary |
|---|---|---|
| App bootstrap, React Query provider, error boundaries | `adapt` | Retained React/Vite/Query architecture; rebuilt a small product-specific bootstrap and routes. |
| Zitadel/auth/session management | `adapt` | Reused the in-memory-session idea, removed EliteResume storage markers and product URL inference, and rebuilt refresh as a single-flight cookie flow. |
| Protected/public/admin guards | `adapt` | Route-guard pattern retained; safe return URL is restricted to `/app`; admin routes deferred because Phase 1 contract exposes role but no Phase 1 admin UI. |
| API client, retries, refresh queue, error normalization | `adapt` | Core dispatcher pattern retained; added true single-flight refresh, cancellation, correlation IDs, 204 handling, and FastAPI 422 fields. |
| User profile, avatar, privacy, deletion | `adapt` | Existing interaction patterns informed forms; schemas and copy rebuilt for EliteApply. |
| Billing/plans/checkout/quota | `retire` | EliteResume Stripe/token APIs are absent from EliteApply OpenAPI and not confirmed by platform capability. No UI or calls copied. |
| Analytics and product events | `adapt` | Central wrapper retained as a pattern; event enum and sensitive-property filter rebuilt from EliteApply contract. |
| Sentry/telemetry | `extract_and_share` | Architecture is reusable, but product/environment configuration and PII scrub rules need a shared package before activation. Phase 1 exposes configuration only. |
| Feature flags/capabilities | `rebuild` | Typed safe-default provider built from EliteApply platform endpoints; failed requests expose nothing. |
| Design primitives/accessibility | `extract_and_share` | Focus, form, empty/error and responsive patterns are generic; visual tokens are deliberately EliteApply-specific. |
| Toast/dialog/form/confirmation | `extract_and_share` | Interaction semantics are reusable; no wholesale component copying in Phase 1. |
| File upload/download | `adapt` | Avatar validation and multipart pattern adapted. Academic signed upload is Phase 2 and requires its own domain workflow. |
| Job Tracker / drag board | `adapt` | Architecture candidate only. Job application → university/scholarship/fellowship/grant application; employer/company → institution/provider; job description → opportunity source. Phase 2. |
| Resume profile/data forms | `adapt` | Resume profile → academic master profile; employment assumptions removed. Phase 2. |
| Rich-text editor/autosave | `extract_and_share` | Lexical/editor mechanics can be shared; document schemas and autosave concurrency must be rebuilt in Phase 3. |
| Revision history/restore | `adapt` | Generic history UI may be reused; EliteApply version/restore contracts differ. |
| PDF/DOCX/text export | `adapt` | Blob/download utility is reusable; export endpoints and document types differ. |
| AI operation polling/usage reservations | `adapt` | Bounded polling mechanics are reusable; billing reservation APIs are not. |
| Verified References | `adapt` | Professional reference → academic reference; candidate/referee/public mechanics need EliteApply schemas and terminology. Phase 3. |
| Interview chat/voice | `adapt` | Job interview → university/scholarship/research/visa interview; content models must be rebuilt. Phase 3. |
| Admin/launch readiness | `rebuild` | EliteResume admin APIs must never be imported. Build only from EliteApply Phase 3 contract. |
| Career landing, ATS, resume templates, cover letters | `retire` | Career-specific workflows and identity do not belong in EliteApply. Cover letter → motivation letter/SOP/personal statement/essay only through Phase 3 APIs. |

## Concept mapping

| EliteResume | EliteApply |
|---|---|
| Job application | University, scholarship, fellowship or grant application |
| Employer/company | Institution, programme or scholarship provider |
| Job description | Programme or scholarship opportunity source |
| Resume profile | Academic master profile |
| ATS match | Eligibility/readiness analysis |
| Cover letter | Motivation letter, SOP, personal statement or essay |
| Professional reference | Academic reference |
| Job interview | University, scholarship, research or visa interview |
