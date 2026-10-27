# Validation — 2026-10-26

Command: `npm test` with Node.js v24.22.1. Result: **36 passed, 0 failed**.

- Server derives mean, sample S.D., goal pairs and narrative from the same core as the UI.
- HMAC/timestamp/UUID validation; user-token verification and owner-scoped Edge queries; CORS rejection.
- Duplicate and out-of-order request versions cannot create duplicate report rows or overwrite newer data.
- Legacy 43-column sheet is copied before a 47-column header upgrade; existing report rows remain intact. Unknown schemas are rejected.
- Spreadsheet formula injection is escaped; oversized cells and invalid counts are rejected before Drive writes.
- Image filenames preserve MIME extension and report version; no Base64 images are stored in cells.
- Legacy narrative goals, structured goals, multiline fields, cleared rows, min/max limits and KPI compatibility.
- Evaluation narrative ordering and ties; unanswered items and single-response S.D.
- Apps Script template replaces public Config and produces six syntactically valid inline scripts.
- Frontend admin alias maps to an email and still uses Supabase signInWithPassword.

The inherited report layout was visually verified in the preceding application update, including three comparison tables on a normal page, pagination with a 48-row fixture, and mobile width. This package does not change the print layout. The new deployment/config and backend changes were tested using simulated APIs. No live Google Apps Script deployment or real Google Sheets/Drive write was performed for this delivery.

The read-only Supabase check found that ANDAMAN2-PM did not yet contain andaman_project_reports or andaman-report-photos. This delivery does not run SQL or deploy Edge Functions to that project.

Supabase browser SDK is bundled from the existing project; Edge Function import pins @supabase/supabase-js@2.118.0. Tests/build have no package dependencies; Node 24+ is required for the bridge TypeScript stripping test.
