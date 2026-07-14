# Unused-endpoint contract gaps

This file covers the nine-operation completion programme. Broader product contract gaps remain in `api-contract-gaps.md`.

- Calendar tokens can be created and revoked, but the API cannot retrieve current feed metadata after reload.
- Calendar feed URLs are secrets with no published expiry or rotation metadata beyond create/revoke.
- Signed `upload_fields` values are generated as `unknown`; the frontend accepts only string/Blob field values without rewriting them.
- Direct signed downloads are provider-neutral; optional Blob downloads still depend on storage-provider CORS.
- Academic profile import, Writing preview, and admin operations expose no signed-file contract, so no transport path was invented.
- `/health`, `/ready`, `/metrics`, and deprecated `/metric` remain unimplemented by explicit scope instruction and require a platform-operations decision.
- The `/metric` removal date is not published.
