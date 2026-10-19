# HTMLinks: implementation and product direction

Updated October 17, 2026 to reflect the account-free product request.

## Product

HTMLinks gives the HTML made by a coding agent a permanent URL. The site offers free managed publishing and an open-source self-hosted option. The agent skill is the normal interface for uploading, editing, replacing, password-protecting, and deleting documents.

There is no management UI, account creation, sign-in, workspace setup, or user API-token configuration. Earlier account/dashboard proposals have been superseded.

## Project structure

Use Jev Playground as the sole structure/tooling reference: one npm package, Next.js App Router, TypeScript, `src/app`, `src/components`, `src/lib`, npm lockfile, a standalone non-root Docker image, and OSS documentation. No Viber or Lemonade internal implementation is used.

## Publishing

- `POST /api/v1/documents` anonymously accepts a self-contained HTML file and metadata.
- Creation returns a random sharing URL, document ID, ETag, and an independent management key.
- Anyone with a link can read an unlisted artifact. A password can gate reader delivery.
- The management key permits changes only to its document. The skill stores it privately and does not print it.
- Replacement creates an immutable revision at the same URL. Mutations use ETags to prevent silent overwrite.
- There is no public document index. Local CLI records provide the agent's `list` function.
- Delete immediately revokes viewing; recovery is possible during the default seven-day retention window.
- Random retry keys support idempotent upload retries; cached responses are encrypted at rest.

## Data and deployment

PostgreSQL stores metadata, management-key hashes, password hashes, viewer grants, idempotency records and the instance storage ledger. HTML bytes use a private filesystem volume or a private Supabase Storage bucket.

Self-hosting uses Docker Compose: PostgreSQL, migration, web and maintenance. A Supabase deployment uses the same source/image with managed Postgres and private Storage. No Supabase Auth dependency is required.

Shared documents use `APP_URL/rendered/<public-id>` and an opaque sandbox; raw HTML also has an HTTP sandbox policy. Inline scripts work. External resource loads, networking, forms, popups, frames, parent access and browser storage are blocked.

## Frontend

The latest user feedback supersedes the earlier dark, dense design. Use a short page on one continuous white canvas with a restrained blue action, one real HTML preview, compact installation, and a collapsed self-host option. Remove animated transitions, the comparison table, gallery, FAQ, and large footer. Keep account-free publishing unchanged.

Design-taste direction: “The quiet instrument,” seed 2047460982. The user's explicit request for simplicity overrides the skill's motion and four-picture defaults. The installer is a working one-command endpoint, with client-specific destinations. Configure the actual public managed origin through `MANAGED_URL` before launch.

## Remaining launch work

Public hosting/domain configuration and a live Supabase project require operator configuration. Validate TLS, DNS, live bucket permissions, backups, egress and abuse controls before accepting public traffic. Native file conversion, collaboration and billing are outside this release.
