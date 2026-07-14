# Unused endpoints Phase 2 report

Date: 2026-07-14

## Outcome

Phase 2 completes the remaining product/browser integrations:

- `GET /api/v1/calendar-feed/{token}.ics` is represented as an external calendar subscription, never fetched by the SPA.
- `PUT /api/v1/storage/upload?token=...` is consumed indirectly through one signed upload transport.
- `GET /api/v1/storage/file?token=...` is consumed indirectly through one signed download transport.

## Calendar Sync UX

The Reminders page now provides a complete Calendar Sync section:

- creates the authenticated feed token;
- displays only a masked subscription URL;
- copies the exact HTTPS URL;
- opens a `webcal://` version produced by changing only the scheme;
- opens or downloads the exact `.ics` URL;
- explains setup for Google Calendar, Apple Calendar, and Outlook;
- revokes an in-session or previously created feed with confirmation;
- explains that the URL is secret and revocation stops future updates;
- provides fixed, recoverable error messages that never render backend token details.

The feed URL remains component memory only. It is not persisted, logged, sent to analytics, fetched through the JSON client, or decorated with the Zitadel bearer token.

## Signed storage architecture

`src/lib/api/signedTransport.ts` is the single provider-neutral transport. It:

- accepts absolute and API-origin-relative URLs;
- permits HTTPS and only permits HTTP for loopback hosts in development;
- rejects malformed, `javascript:`, `data:`, and external insecure HTTP URLs;
- preserves absolute signed URLs and their query ordering;
- supports raw PUT and multipart POST using the server-returned method and fields;
- validates maximum size before transfer;
- preserves the supplied content type for raw PUT;
- supports `AbortSignal` and XHR upload progress when a progress callback is supplied;
- bypasses the authenticated JSON interceptor;
- sends no bearer header and uses omitted fetch credentials;
- opens downloads through safe anchors or optionally fetches a Blob;
- revokes temporary object URLs;
- produces token-redacted display/log strings and uses sanitized transfer errors.

## Migrated flows

| Flow | Migration |
| --- | --- |
| Academic document upload | `uploadAcademicDocument` now delegates to `uploadToSignedUrl`. |
| Academic document download | Uses typed `DocumentDownloadResponse` and `openSignedDownload`. |
| Academic reference evidence | Uploads are existing academic-document selections, so they inherit the shared document transport. |
| Reference letter/certificate downloads | Existing `downloadResponse` now routes signed JSON/text responses through `openSignedDownload`. |
| Interview audio | `uploadInterviewAudio` now delegates to `uploadToSignedUrl`. |
| Writing Studio exports | Existing raw responses use the hardened `downloadResponse`, including signed URL metadata when returned. |
| Application package export | The contract returns direct JSON, not a signed URL. `downloadResponse` now correctly saves ordinary JSON instead of rejecting it as missing signed metadata. |
| Account export | Uses the same hardened raw-response download adapter. |

No file migration was invented for academic profile import, Writing Studio preview, or admin import/export: the current OpenAPI exposes structured JSON profile import, JSON/HTML preview data, and no signed admin import/export flow.

## Security controls

- Calendar and storage secrets are never rendered unmasked as text.
- Calendar links use `rel="noopener noreferrer"` for external navigation.
- Signed transfers never use `apiRequest`, refresh interception, correlation logging, or bearer authentication.
- Transfer failures contain status only and never include the signed URL.
- `redactSignedUrl` removes query and fragment values.
- Unit and browser tests use sentinel secrets and assert they do not appear in visible errors or masked URL output.

## Tests

Focused unit coverage includes relative/local and absolute PUT, multipart POST, maximum-size rejection, cancellation, progress, failed transfer, content type, exact query ordering, auth omission, direct signed navigation, Blob cleanup, token redaction, malicious schemes, calendar URL conversion/masking, and ordinary JSON exports.

Browser coverage creates, masks, copies, opens, downloads, explains, and revokes the calendar feed, checks desktop/mobile layouts, verifies a safe error state, and asserts that the SPA never requests the `.ics` operation.

## Contract issues and changed assumptions

1. The calendar API has create/revoke operations but no authenticated GET for current feed metadata. The frontend cannot redisplay an existing secret after reload; it can still revoke it.
2. `upload_fields` is generated as an unknown-value record. The transport accepts only returned string/Blob values and rejects other shapes rather than stringifying or rewriting them.
3. Academic document downloads are explicitly typed as `DocumentDownloadResponse`; several export/certificate endpoints are raw responses and may return a file or signed metadata depending on content type.
4. Cross-origin Blob download remains subject to provider CORS. Direct browser navigation is the default because it does not require SPA CORS access.
5. The prompt listed possible flows beyond the published contract. Only flows that actually receive signed URLs were migrated.

## Files changed

- `src/lib/api/signedTransport.ts`
- `src/lib/api/download.ts`
- `src/lib/api/phase2.ts`
- `src/lib/api/phase3.ts`
- `src/lib/calendarFeed.ts`
- `src/features/documents/DocumentsPage.tsx`
- `src/features/reminders/RemindersPage.tsx`
- `src/styles/index.css`
- `src/tests/signed-transport.test.ts`
- `e2e/phase3.spec.ts`
- `docs/api/openapi-operation-usage.json`
- `scripts/check-openapi-operation-usage.mjs`
- `package.json`

## Next-phase heads-up

The only original operations left are deployment/monitoring endpoints. They remain excluded by user instruction. Do not add customer-facing React polling for them.
