# Document storage API

Document binaries never pass through the API in managed-storage modes. The API checks the
authenticated route guard, creates a short-lived URL, and returns only the URL
and the object key to the browser.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/v1/documents/:id/signed-upload` | Issue a short-lived PUT URL for a new version. |
| POST | `/api/v1/documents/:id/signed-download` | Issue a short-lived GET URL for the current version. |

`STORAGE_MODE=mock` returns local contract URLs for UI development.
`STORAGE_MODE=supabase` is the production default and requires `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_STORAGE_BUCKET`. `STORAGE_MODE=r2`
remains available with its four R2 credentials. Both managed modes fail closed
with `STORAGE_UNAVAILABLE` when configuration or signing fails. The service-role
key and R2 secret never leave the API; the browser receives only the short-lived
URL and must send the returned `requiredHeaders`.

The document upload screen creates metadata, requests a signed upload URL, and
then sends the selected file bytes directly to private storage. The stored
document version and signed-upload endpoint use the same `storageKey`.
