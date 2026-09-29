# Document storage API

Document binaries never pass through the API in the R2 path. The API checks the
authenticated route guard, creates a short-lived URL, and returns only the URL
and the object key to the browser.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/v1/documents/:id/signed-upload` | Issue a short-lived R2 PUT URL for a new version. |
| POST | `/api/v1/documents/:id/signed-download` | Issue a short-lived R2 GET URL for the current version. |

`STORAGE_MODE=mock` returns local contract URLs for UI development. `STORAGE_MODE=r2`
requires all four R2 secrets (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`) and fails closed with `STORAGE_UNAVAILABLE` when a secret is
missing. The API signs only the host header; the browser must send the returned
`requiredHeaders` for uploads.

The upload URL does not mark a version complete by itself. The client must upload
the bytes, then call the document-version endpoint with the returned `storageKey`
and the server must persist the metadata in the next Prisma repository phase.
