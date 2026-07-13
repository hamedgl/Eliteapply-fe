# Marketing, SEO and production-readiness — Phase 0 audit

Date: 2026-07-13  
Scope: repository at `/home/hamed/Eliteapply-fe` and deployed responses from `eliteapply.net`  
Phase status: **complete as an audit; not ready for production SEO rollout**

## Executive outcome

EliteApply is a React/Vite single-page application with a strong existing visual direction and working, contract-backed product routes. Its current marketing and SEO delivery model is not production-ready:

1. The homepage copy is rendered only after JavaScript runs. The initial HTML contains metadata and an empty `<div id="root"></div>`, so the requirement that key marketing content be present in server-rendered HTML is not met.
2. One static homepage `<head>` is served for every route. Login, account, workspace, referee-token, verification and unknown URLs all inherit `index,follow`, the homepage canonical and homepage structured data.
3. `robots.txt` and `sitemap.xml` do not exist as files. In production, both URLs return the SPA HTML shell with `200 text/html`.
4. Unknown URLs return the SPA shell with HTTP 200 and there is no router not-found route. This creates soft 404s.
5. `http://eliteapply.net/` returns HTTP 200 instead of redirecting to the canonical HTTPS origin.
6. Terms and privacy routes contain launch-placeholder copy rather than approved legal content.

The authenticated workspace, generated API contract, in-memory access-token model and HttpOnly refresh-cookie flow should be preserved. Marketing rendering and route-aware metadata can be changed without rewriting those product integrations.

## Repository inventory

| Concern | Current implementation | Assessment |
|---|---|---|
| Framework | React `19.2.7`, React DOM `19.2.7`, Vite `6.4.3`, TypeScript `5.8.3` (installed versions) | Modern client stack; no SSR/SSG layer. |
| Routing | React Router DOM `7.18.1`, `createBrowserRouter` in `src/app/App.tsx` | Browser-only data router. No `errorElement` or catch-all route. |
| Rendering | `createRoot` in `src/main.tsx`; Vite emits one static `dist/index.html` | Fully client-rendered. Marketing content is not in the initial response. |
| Route bootstrap | `/`, `/terms`, `/privacy`, `/accessibility` load `App` directly. All other paths load `PrivateRoot`, restore a session, then render `App`. | Public auth/referee/verification flows unnecessarily pass through private session bootstrap. |
| Shared design system | `DESIGN.md`, `PRODUCT.md`, global CSS variables and component classes in `src/styles/index.css` | Useful visual contract, but implementation is a monolithic global stylesheet with base and `--m-*` token namespaces. `DESIGN.md` names `eliteapply-design.prod.json` as the machine source of truth, but that file is absent. No shared component package or Storybook exists. |
| Typography | DM Sans and Source Serif 4 from Google Fonts in both `index.html` and a CSS `@import` | Correct brand pairing, loaded twice. Fonts are not self-hosted; the CSS import is render-blocking and duplicates the HTML request. |
| Analytics | First-party `track` wrapper posts typed events to `/api/v1/analytics/events` and removes sensitive-looking keys | No calls to `track` exist, so marketing conversion analytics are not active. No third-party analytics or active Sentry integration was found. |
| Authentication | Zustand memory-only access/ID tokens; cookie-based refresh; single-flight refresh; `Protected` and `PublicOnly` guards | Preserve. This matches the documented privacy boundary and avoids browser token persistence. |
| API integration | Central API client, generated OpenAPI types, TanStack Query for server state, lazy private feature bundles | Preserve. Marketing work does not require API contract changes. |
| Metadata | Static title, description, canonical, Open Graph, Twitter and robots tags in `index.html` | Homepage-only values leak to every URL. No route-aware metadata generation. No `og:image`/Twitter image. |
| Structured data | Static `WebApplication` JSON-LD in `index.html` | Reasonable homepage starting point, but incorrectly appears on every route and is not route-aware. |
| `robots.txt` | No repository file | Production `/robots.txt` returns the app HTML shell with `200 text/html`; this is not a valid robots file. |
| Sitemap | No repository implementation | Production `/sitemap.xml` returns the app HTML shell with `200 text/html`; there is no XML sitemap. |
| Canonical handling | Static `https://eliteapply.net/` link in the shared HTML | Every route claims the homepage canonical. HTTP does not redirect to HTTPS. `www.eliteapply.net` did not resolve during the audit. |
| Legal pages | Inline `Legal` component for terms/privacy; separate accessibility statement | Terms and privacy are explicit placeholders. Accessibility has useful initial copy and a support contact, but no unique metadata. |
| Loading states | Root/private Suspense fallbacks plus several page-level query loading states | Present but inconsistent; there is no route-level loading/error contract. |
| Error states | Some feature-specific query errors | No application error boundary and no router `errorElement`. Unexpected render failures are not handled centrally. |
| Not found | None | Unknown client routes have no matching UI; production serves them with HTTP 200. |
| Deployment configuration | No Vercel, Netlify, Cloudflare, nginx, container or CI deployment config in this repository | SPA fallback and redirects are controlled outside the repository and are not versioned here. Current Cloudflare responses expose no CSP or HSTS header. |

## Current route inventory and indexation policy

“Public” below means accessible without an authenticated student session. Public does not automatically mean indexable.

### Public and authentication routes

| Route | Current purpose | Required policy | Reason / launch condition |
|---|---|---|---|
| `/` | Marketing homepage | `index,follow` | Canonical public category/brand page. Must render substantive copy in initial HTML. |
| `/accessibility` | Accessibility statement | `index,follow` | Legitimate public trust page once it has unique metadata and canonical. |
| `/terms` | Terms of Service | `noindex,nofollow` **for now** | Placeholder copy is not publishable. It may become `index,follow` after legal approval and route-specific metadata. |
| `/privacy` | Privacy Policy | `noindex,nofollow` **for now** | Placeholder copy is not publishable. It may become `index,follow` after legal approval and route-specific metadata. |
| `/login` | Sign in | `noindex,nofollow` | Utility/authentication page. |
| `/register` | Account creation | `noindex,nofollow` | Utility/authentication page. |
| `/confirm-email` | Email confirmation | `noindex,nofollow` | Account state and code-bearing flow. |
| `/forgot-password` | Password recovery request | `noindex,nofollow` | Account security flow. |
| `/reset-password` | Password reset | `noindex,nofollow` | Account security and code-bearing flow. |
| `/referee/academic-reference/:token` | Referee invitation/submission | `noindex,nofollow` | Tokenized private workflow; never include in sitemap, analytics URLs or canonical public content. |
| `/verify/academic-reference/:publicId` | Public reference verification | `noindex,nofollow` | Parameterized verification result with personal/contextual data and no search-acquisition value. |

### Authenticated application routes

All routes in this section must return `noindex,nofollow`, must never appear in the sitemap and must retain backend authorization as the authoritative data boundary.

| Route | Purpose |
|---|---|
| `/app` | Redirect to dashboard |
| `/app/dashboard` | Student dashboard |
| `/app/onboarding` | Onboarding entry (currently dashboard UI) |
| `/app/applications` | Application list/board |
| `/app/applications/:id` | Application workspace |
| `/app/applications/import` | Opportunity import |
| `/app/academic-profile` | Academic profile |
| `/app/documents` | Document vault |
| `/app/catalogue` | Catalogue |
| `/app/writing` | Writing library |
| `/app/writing/new` | New writing document |
| `/app/writing/:id` | Writing editor/draft |
| `/app/stories` | Story and evidence bank |
| `/app/references` | Reference tracker |
| `/app/references/new` | New reference request |
| `/app/interviews/new` | Interview practice |
| `/app/admin/launch` | Internal launch controls |
| `/app/settings/profile` | Account profile settings |
| `/app/settings/security` | Account security settings |
| `/app/settings/privacy` | Account privacy/data settings |
| `/app/unavailable` | Capability fallback |

### Unknown routes

Unknown paths must return a real HTTP 404 and a useful branded not-found page with `noindex,nofollow`. They must not return the homepage with status 200.

## Initial HTML verification

### Repository build

`npm run build` passed. The emitted `dist/index.html` contains homepage metadata and JSON-LD, but the body is only:

```html
<div id="root"></div>
```

The homepage H1 and supporting copy occur only inside the JavaScript bundle. This fails the Phase 0 server-rendered-marketing-content requirement even though a JavaScript-capable crawler or browser can render the page later.

### Production responses observed on 2026-07-13

| Request | Observed response |
|---|---|
| `https://eliteapply.net/` | `200 text/html` |
| `https://eliteapply.net/robots.txt` | `200 text/html`, homepage SPA shell |
| `https://eliteapply.net/sitemap.xml` | `200 text/html`, homepage SPA shell |
| `https://eliteapply.net/login` | `200 text/html`, shared homepage head |
| `https://eliteapply.net/app/dashboard` | `200 text/html`, shared homepage head |
| `https://eliteapply.net/definitely-not-a-real-route` | `200 text/html` soft 404 |
| `http://eliteapply.net/` | `200 text/html`, no HTTPS redirect |

The live HTML asset hashes matched the local production build during this audit, so the repository is representative of the deployment checked.

## Required implementation direction for later phases

### Release blockers (P0)

1. Add server rendering or build-time prerendering for every indexable marketing/legal route. The initial response for `/` must include its H1, supporting paragraph, primary navigation and useful product explanation without executing JavaScript.
2. Generate route-specific title, description, canonical, robots, Open Graph/Twitter metadata and JSON-LD in the initial HTML response.
3. Make every authentication, tokenized and `/app` route `noindex,nofollow` in its initial response. Do not rely on a client-side head update for this privacy control.
4. Serve a valid `/robots.txt` as `text/plain` and a valid `/sitemap.xml` as XML. Initially the sitemap should include only fully published canonical indexable routes (`/`, and `/accessibility` once its metadata is ready).
5. Return a real 404 for unknown routes and add a branded router/server not-found experience.
6. Enforce one HTTPS canonical origin. Redirect HTTP to HTTPS before serving content.
7. Replace terms/privacy placeholders with approved legal copy before launch.

### High-priority hardening (P1)

1. Add route-level error handling and an application error boundary.
2. Move public auth, referee and verification routes out of the private session bootstrap; only authenticated app routes should require the refresh/bootstrap provider.
3. Self-host the required WOFF2 font subsets where practical and remove the duplicate Google Fonts load.
4. Add a real social preview image with explicit dimensions and validate it on every indexable page.
5. Version deployment behavior in the repository: rewrites, 404 handling, HTTP/HTTPS redirects, CSP, HSTS and other security headers.
6. Wire only documented, consent-appropriate marketing events through the existing privacy-filtering analytics wrapper. Never send essay, document, reference, profile, token or code content.
7. Reconcile the documented design-system source of truth: restore/generate the referenced JSON token file or amend `DESIGN.md`; consolidate duplicated token namespaces before broad page growth.

## Safe implementation boundaries

The following working foundations must be preserved during marketing/SEO work:

- Access and ID tokens remain memory-only; do not introduce localStorage or sessionStorage persistence.
- Refresh remains an HttpOnly-cookie, credentialed, single-flight backend flow.
- `Protected` remains a UX guard, while backend authorization remains authoritative.
- Referee invitation tokens/codes remain ephemeral and out of analytics/storage; referee codes remain request headers rather than URL parameters.
- Generated OpenAPI schema and the central API client remain the contract boundary.
- TanStack Query remains the server-state layer for the authenticated product.
- Private feature bundles remain lazy-loaded and must not be pulled into indexable marketing output.
- Existing accessible landing interactions and honest product preview content can be reused, but metadata, legal components, global error handling and rendering architecture need refactoring.
- No dependency was added in Phase 0. A later rendering dependency or framework change is justified only if it produces route-correct initial HTML and deployable status/header control; a client-only head library is insufficient.

## Phase 0 acceptance record

- [x] Framework/version, routing and rendering model identified.
- [x] Design system, typography and font loading identified.
- [x] Analytics and authentication boundaries identified.
- [x] Metadata, robots, sitemap, canonical and structured-data behavior identified.
- [x] Legal, loading, error and not-found implementation identified.
- [x] Current public and authenticated routes recorded.
- [x] Index/noindex policy assigned.
- [x] Initial server HTML inspected locally and in production.
- [x] Existing authentication, workspace and API boundaries documented for preservation.
- [x] Dependency posture documented; no dependencies added.

Phase 1 should not begin by layering additional client-only marketing sections onto the current shell. The rendering, metadata, crawler-file and status-code blockers above need to be resolved as part of the public-route foundation.
