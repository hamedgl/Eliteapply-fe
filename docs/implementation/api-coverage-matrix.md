# Target OpenAPI operation coverage matrix

Date: 2026-07-14

| Operation | Classification | Consumer and evidence |
| --- | --- | --- |
| `GET /api/v1/applications/{application_id}/requirements` | `direct-spa` | URL-addressable Requirements panel; `applicationQueries.ts`; Phase 1 E2E. |
| `GET /api/v1/applications/{application_id}/tasks` | `direct-spa` | URL-addressable Tasks panel; `applicationQueries.ts`; Phase 1 E2E. |
| `GET /api/v1/calendar-feed/{token}.ics` | `external-calendar-client` | HTTPS/webcal URL consumed by calendar applications; Calendar Sync E2E. |
| `PUT /api/v1/storage/upload` | `indirect-signed-url` | `uploadToSignedUrl`; academic document and interview audio flows. |
| `GET /api/v1/storage/file` | `indirect-signed-url` | `openSignedDownload` / `downloadSignedFile`; document/export flows. |
| `GET /health` | `not-yet-implemented` | Explicitly excluded; platform operations owner. |
| `GET /ready` | `not-yet-implemented` | Explicitly excluded; platform operations owner. |
| `GET /metrics` | `not-yet-implemented` | Explicitly excluded; external monitoring owner. |
| `GET /metric` | `not-yet-implemented` | Explicitly excluded and deprecated; intentionally unused. |

The machine-checked source is `docs/api/openapi-operation-usage.json`; validate it with `npm run api:usage`.
