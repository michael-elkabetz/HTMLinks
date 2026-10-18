# Deployment and operations

## Public discovery and search

Canonical URLs, sitemap entries, documentation examples, and social metadata use `APP_URL` at runtime. Set it to the intended HTTPS origin and make the reverse proxy redirect alternate hosts to that origin while preserving paths and queries. These marketing routes remain dynamically rendered so a Docker image does not bake in a build machine’s origin.

Public-page indexing defaults on for `htmlinks.com` and `www.htmlinks.com` only. Set `INDEX_PUBLIC_SITE=1` to opt in on another HTTPS origin, or `INDEX_PUBLIC_SITE=0` on staging/private deployments. Non-HTTPS origins stay nonindexable. Disabled instances emit noindex headers/metadata, disallow crawlers, and serve an empty sitemap. These are discovery preferences, not access controls.

The public sitemap includes only the homepage, documentation, publishing guides, and about page. Shared `/rendered/` documents, examples, APIs, installer files, and skill downloads are excluded and remain noindexed. Shared pages stay crawlable so crawlers can observe their noindex responses; do not replace document authentication with robots rules.

After deploying, verify `/robots.txt`, `/sitemap.xml`, page-specific canonical URLs, and `/opengraph-image`. Submit the sitemap to verified Google Search Console and Bing Webmaster Tools properties, inspect the public URLs, and check actual crawler logs/Cloudflare rules. Search/user fetchers and training crawlers are separate policy choices. No analytics collection or third-party tracking was introduced by the SEO changes; add measurement through the operator’s chosen privacy policy and tooling.

## Self-hosting

Install the agent skill from GitHub with `npx skills add michael-elkabetz/HTMLinks --skill htmlinks`. It includes the standalone upload helper. Use the first-use question to select this instance’s app origin; installation does not choose a hosting destination. The instance-specific `/install` script remains available as an alternative.

Run `node scripts/init.mjs`, then `docker compose up --build -d`. Initialization writes `.env` with private permissions and unique database/encryption secrets. Rerunning never overwrites an existing file. Open the landing page and install the skill. There is no account, setup token, or registration step. On first use, choose self-hosted and provide the app origin; the skill remembers it in a private local settings file. The same skill can later switch to managed hosting with its config command.

Compose starts PostgreSQL, a one-shot migration, one web service, and maintenance. The web service handles publishing and sandboxed document delivery under `/rendered/`. PostgreSQL is private to the Compose network. Local ports bind to loopback.

Docker production variables override `.env`'s loopback database connection with the Compose service address. For host development, `compose.dev.yaml` exposes the development database on 5439. Use a separate Compose project (as documented in the [usage guide](USAGE.md#development-and-checks)) to keep development volumes apart from production.

Set `APP_URL` to the canonical HTTPS origin, for example `https://www.htmlinks.com`. The site, API, password screens, and shared documents use that origin. Uploaded HTML executes in an opaque sandbox under `/rendered/`; see [same-domain hosting](SHARED-DOMAIN.md). Do not share cookies with a Domain attribute. Terminate TLS at a reverse proxy and preserve the expected Host header. Unknown hosts are rejected. Both reader unlock and author handoff POSTs must originate from the app origin.

The proxy should cap requests at 12 MiB, set header/body timeouts, and replace incoming `X-Forwarded-For`. Only then enable `TRUST_PROXY=1`. Otherwise login/password rate limits intentionally share a conservative source bucket. Never trust arbitrary client-supplied forwarding headers. Restrict direct access to the upstream containers.

Example Caddy routing (replace the example domain; provision DNS and TLS yourself):

```caddyfile
app.example.com {
  request_body { max_size 12MB }
  reverse_proxy web:3000 {
    header_up Host app.example.com
  }
}
```

No DNS, cloud account, public exposure, or TLS configuration is created by the repository. When adding a proxy container, attach it to the application network; keep upstream services private.

## Configuration

See `.env.example`. `MAX_UPLOAD_BYTES` can lower the 10 MiB limit. The internal instance ledger defaults to 10 GiB. Operators can change its quota through the private database. All revisions and files awaiting purge count toward usage. `RETENTION_DAYS` defaults to seven. The maintenance loop runs every five minutes. Changing the retention setting requires restarting web and maintenance; the documentation describes the default seven-day period.

Migrations are ordered SQL files recorded in `htmlinks.migrations`. The runner holds an advisory transaction lock. Migration failures stop service startup. Back up before upgrades; there are no automatic down migrations. Pin the same application image across web, migration, and maintenance processes.

Runtime readiness is `/api/health`. Keep it internal to the proxy or monitoring. Container startup checks database reachability and migration metadata; it does not guarantee object storage availability. Request failures return a request ID and log exception name/code/location without SQL parameters, document contents, credentials, or passwords.

## Supabase

For Render, follow the [Supabase + Render launch guide](RENDER.md). The repository includes a `render.yaml` Blueprint for one web service and scheduled maintenance.

1. Create a Supabase project and a **private** Storage bucket, for example `htmlinks`. Never make the bucket public.
2. Set `DATABASE_URL` to the appropriate Postgres connection or pooler. Keep `prepare: false` for pooling. Set `MIGRATION_DATABASE_URL` to a direct/migration connection when needed.
3. Set `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET`.
4. Run migrations and deploy the web service. Run `node scripts/maintenance.mjs --loop` as a maintenance process or schedule one-shot maintenance.
5. Keep the `htmlinks` schema out of exposed Data API schemas. No identity provider or Supabase Auth is needed.

Server-side service credentials bypass ordinary storage policies. Every HTMLinks operation therefore checks per-document management keys before reading or writing objects. Do not expose these credentials to browsers, the skill, build arguments, or public environment variables. The viewer proxies authorized bytes; it never returns storage credentials or reusable object URLs.

With Supabase, deploy application containers without the local Compose database service and supply your runtime database connection directly. The default Compose file deliberately targets its own PostgreSQL service. See `compose.cloud.yaml` for the application-only profile.

A live Supabase project is not needed for local tests. Validate live credentials, bucket access, region, pooling, backups, storage egress, and multi-replica rate limits before operating a managed service. The managed service uses the same anonymous-upload API. Configure its public origin through `MANAGED_URL` and operate rate limits and abuse controls before launch.

## Back up and restore

Back up both PostgreSQL and HTML bytes. A database-only backup cannot restore documents.

For a consistent self-hosted backup, stop writers and maintenance first. Example commands use the default Compose project and create files in the local `backups/` folder (keep backups private):

```sh
mkdir -p backups
chmod 700 backups
docker compose stop web maintenance
docker compose exec -T db pg_dump -U hstore -d hstore -Fc > backups/htmlinks.dump
docker compose run --rm --no-deps -T --user root --entrypoint tar web -C /app/data/uploads -czf - . > backups/uploads.tar.gz
docker compose start web maintenance
```

Save `.env` separately through secure secret storage. File archives contain original HTML, and database dumps contain password hashes and reader grants. Limit access and encrypt backups with your existing backup tooling. Restore both backup files into a **new, empty** instance and verify privately before changing DNS:

```sh
# Start a new Compose project with its own .env and fresh volumes.
docker compose up -d db
# Wait until PostgreSQL is healthy before the following commands.
docker compose exec -T db pg_restore -U hstore -d hstore --no-owner < backups/htmlinks.dump
docker compose run --rm --no-deps -T --user root --entrypoint tar web -C /app/data/uploads -xzf - < backups/uploads.tar.gz
docker compose up -d
```

The dump includes migration history. Ensure restored file ownership allows the non-root Node user (UID 1000) to read/write uploads. Test unlisted and password-protected documents, stored management keys, all revisions, and source download. Keep the original backup until the restore is verified. Supabase deployments need coordinated database and object-storage backups through their respective backup tooling; database snapshots do not include Storage bytes.

## Deletion and cleanup

Soft deletion revokes future delivery immediately. After retention, maintenance queues each revision blob for deletion and removes its metadata. Failed blob deletions retry every 15 minutes; instance usage decreases only after removal. A committed cleanup record also tracks failed/crashed uploads. Before deleting a staged object, maintenance checks that no committed revision references it. Cleanup is idempotent across reruns.

Ordinary restore is only available inside the configured retention window. Removing Docker volumes bypasses recovery. HTMLinks cannot recall copies already downloaded by recipients.

## Upgrading from the previous name

HTMLinks uses `HTMLINKS_SECRET` and `HTMLINKS_PORT`. The corresponding `HSTORE_*` settings remain accepted as fallbacks. Keep the same instance secret: changing it invalidates encrypted retry responses.

The migration runner renames the private `hstore` schema to `htmlinks` in one transaction, preserving its tables and migration history. Back up first and restart all application roles together; older application versions use the previous schema name. Keep both schema names outside Supabase's exposed Data API schemas.

Compose retains its previous project, database user, database name, and volume identities to reuse existing data. These internal identifiers do not affect the public brand. Keep your existing Compose project override if you use one, and keep `SUPABASE_BUCKET` pointing to the existing private bucket.

The renamed agent skill uses `HTMLINKS_URL`, `HTMLINKS_CONFIG_DIR`, and `HTMLINKS_MANAGEMENT_KEY`, with the old `HSTORE_*` names as fallbacks. It reuses `~/.config/hstore/` when no new configuration directory exists, preserving destinations and document keys. The previous helper download URL remains an alias.
