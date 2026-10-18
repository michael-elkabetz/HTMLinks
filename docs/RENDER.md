# Launch HTMLinks on Render with Supabase

Use Supabase for PostgreSQL and private Storage. Render runs one Docker web service for the site, API, and shared pages, plus a cleanup cron job. No Render disk or Render PostgreSQL service is needed.

## 1. Create the Supabase project

Create a project in **Central EU (Frankfurt)** to match the included Render Blueprint, and disable **Automatically expose new tables**. Save the database password. From the project's **Connect** dialog, copy the **Session pooler** URI on port **5432**. It works over IPv4 and supports the long-lived application processes. Add `?sslmode=require` (or `&sslmode=require` if it already has a query string), and URL-encode special characters in the password. Copy the full pooler username, including the project reference.

Get the project URL and the legacy **service_role** JWT from project settings → API Keys → Legacy API Keys. The current Storage client sends this JWT in both `Authorization: Bearer` and `apikey` headers; use the legacy `service_role` value for `SUPABASE_SERVICE_ROLE_KEY`. Do not substitute an `anon`, publishable, or `sb_secret_...` key into this configuration.

Keep `htmlinks` and the legacy `hstore` schema out of exposed Data API schemas. Supabase Auth and browser API keys are not required.

## 2. Provision storage and database

On your own machine, put production values into a private, git-ignored file such as `.env.production.local`:

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@POOLER_HOST:5432/postgres?sslmode=require
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=LEGACY_SERVICE_ROLE_JWT
SUPABASE_BUCKET=htmlinks
```

From the repository root, run:

```sh
node --env-file=.env.production.local scripts/setup-supabase.mjs
node --env-file=.env.production.local scripts/migrate.mjs
```

Alternatively, with these settings already in `.env`, run `npm run supabase:setup`.

Setup creates the bucket as private or verifies that an existing bucket is private. It refuses an existing public bucket. Migrations create the private `htmlinks` schema and record applied SQL files; reruns skip completed migrations. No public Storage policies are needed. This provisions a new installation; it does not transfer existing local documents to Supabase.

## 3. Deploy the Render Blueprint

Push this checkout to your Git repository, then choose **New → Blueprint** in Render and select `render.yaml`. This configuration creates paid compute resources; review the selected plans and choose the region nearest Supabase before creation. Use the same branch/release for the web service and cleanup job. The web service runs migrations in its pre-deploy command; an advisory transaction lock serializes concurrent migration attempts.

Supply the following values when the Blueprint prompts:

| Variable                    | Value                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| `APP_URL`                   | Canonical HTTPS app origin, for example `https://www.htmlinks.com`           |
| `DATABASE_URL`              | Supabase Session pooler URI from step 1, including TLS and database password |
| `SUPABASE_URL`              | `https://PROJECT_REF.supabase.co`                                            |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy `service_role` JWT                                                    |

The cleanup job references the app service's database/storage settings. The shared environment group generates **one** `HTMLINKS_SECRET` and sets `STORAGE_DRIVER=supabase`, `SUPABASE_BUCKET=htmlinks`, `MAX_UPLOAD_BYTES=10485760`, `RETENTION_DAYS=7`, and `TRUST_PROXY=0`. Keep the generated instance secret stable and back it up securely. If moving an existing installation, replace the generated value with its existing `HTMLINKS_SECRET` before serving traffic.

Cleanup runs `node scripts/maintenance.mjs` every five minutes. The web service uses the existing Dockerfile and `/api/health` readiness check. Its Docker image sets `NODE_ENV=production` and binds to `0.0.0.0`; Render supplies `PORT`.

Add the `APP_URL` custom domain to **htmlinks-web** in Render and configure DNS. For the managed deployment, use `https://www.htmlinks.com`. One web service serves shared pages at `/rendered/<public-id>` alongside the site and API. The configured origin must have no path, credentials, query, or fragment. The app rejects requests for other hostnames, except its health check. Uploaded HTML remains in an opaque sandbox.

Leave `TRUST_PROXY=0` until you verify that your ingress replaces client-supplied `X-Forwarded-For`; this uses a shared source bucket for rate limits. See the [proxy requirements](DEPLOYMENT.md#self-hosting).

Optional: set `MIGRATION_DATABASE_URL` on the web service to a separate migration connection. The Session pooler connection can run the existing migrations, so this is not required. `MANAGED_URL` optionally overrides the managed origin embedded in the downloaded CLI; by default it uses `APP_URL`. `MAX_DAILY_UPLOADS` defaults to 500 for this anonymous instance. Never prefix credentials with `NEXT_PUBLIC_` or put them in Docker build arguments. `POSTGRES_PASSWORD` and `STORAGE_PATH` are only needed for local PostgreSQL/filesystem hosting.

For manual Render setup instead of the Blueprint, copy the four prompted variables plus the shared group settings to one Docker web service. Set `HTMLINKS_SECRET` once (generate it with `openssl rand -hex 32`) and use `node scripts/migrate.mjs` as the pre-deploy command. Create a Docker cron job with the same database/storage settings and the command/schedule above.

## 4. Verify before sharing the service

Check `/api/health` on the app origin. Upload a small HTML file through the app/CLI, open its `/rendered/` link, update it at the same link, and try a password-protected document. Confirm that the file appears in the private Supabase bucket and remains available after a Render redeploy. Run the maintenance cron job once and check its logs. The readiness endpoint checks database migrations; it does not test Storage credentials or bucket availability.

Live provisioning and verification require your project's credentials. Local unit checks cannot establish that the production project, DNS, and storage are working.

References: [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase API keys](https://supabase.com/docs/guides/api/api-keys), [Render Blueprint specification](https://render.com/docs/blueprint-spec), [Render environment variables](https://render.com/docs/configure-environment-variables).
