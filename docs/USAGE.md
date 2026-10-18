# HTMLinks usage and development

[Back to the README](../README.md)

Detailed setup, CLI, API, and development reference. Run commands from the repository root. For a local skill installation before the repository is published, use `npx skills add . --skill htmlinks`.

## Run it yourself

Requires Docker Compose and Node.js 22.22+ for initialization. Get the source and run:

```sh
git clone https://github.com/michael-elkabetz/HTMLinks.git
cd HTMLinks
node scripts/init.mjs
docker compose up --build -d
```

Open [localhost:3000](http://localhost:3000). Install the skill from the landing page. There is no account to create. Shared pages use the same origin under `/rendered/`.

Set `APP_URL` to your canonical origin; the web service serves `/rendered/` links with opaque content sandboxing. See [same-domain hosting](SHARED-DOMAIN.md). For a busy port, change `APP_URL` and `HTMLINKS_PORT` in `.env`. Local ports bind to loopback. `docker compose down` preserves data; removing volumes destroys it.

## Use the skill

Install directly from GitHub using the [Skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add michael-elkabetz/HTMLinks --skill htmlinks
```

Choose your agent when prompted, or target it explicitly:

```sh
npx skills add michael-elkabetz/HTMLinks --skill htmlinks --agent claude-code
npx skills add michael-elkabetz/HTMLinks --skill htmlinks --agent codex
```

Installation is per project by default. Add `--global` for all projects. Reload your agent’s skills afterward. The skill and standalone helper live together in `skills/htmlinks/`; no app dependencies or API token are needed. The helper requires Node.js 22.22+.

On first use, the skill asks whether to upload to free managed hosting or your own self-hosted instance, then remembers the choice. The CLI also prompts when run interactively; automation must configure a destination explicitly before uploading. Upgrading the skill preserves this preference.

From a checkout:

```sh
node skills/htmlinks/scripts/htmlinks.mjs config --hosting self-hosted --url http://localhost:3000
node skills/htmlinks/scripts/htmlinks.mjs upload examples/idea.html
node skills/htmlinks/scripts/htmlinks.mjs update <document-id> ./revised.html
node skills/htmlinks/scripts/htmlinks.mjs delete <document-id>
node skills/htmlinks/scripts/htmlinks.mjs help
```

Use `config --hosting managed` for the configured managed service, or `config --hosting self-hosted --url https://your-server` to switch. `config` alone reports the saved destination. The preference lives in `~/.config/htmlinks/settings.json`. `HTMLINKS_URL` overrides it for one invocation without changing the saved choice. Keys are stored in per-origin, per-document files in the same configuration directory with private permissions. The helper never prints those keys. Back up this directory: a sharing URL cannot recover editing access.

For password protection, use `--access password --password-stdin`. Supply the password securely through stdin, never as a command argument or in a chat transcript.

The skill offers link access or password protection per upload. Passwords are checked by the server before HTML is delivered. Use `access <id> --mode password --password-stdin` to protect an existing document or change its password; content updates keep it. Hosting preferences never store document passwords.

To install from a local checkout before publishing the GitHub repository, use `npx skills add . --skill htmlinks`. An instance-specific shell installer remains available at `/install`. GitHub-installed skills do not inherit a server URL from the website; the first-use choice configures their destination. Until a real managed origin is supplied, the bundled loopback URL is for local development only.

## API

The API is `/api/v1`. Upload without authentication:

```sh
curl http://localhost:3000/api/v1/documents \
  -F 'file=@examples/idea.html' \
  -F 'metadata={"title":"Design proposal","access":"link"}'
```

The response includes `id`, `url`, `manageKey`, `revision`, and `etag`. Keep `manageKey` private: it controls **only this document**. Later metadata/source/revision reads, updates, and deletion require `Authorization: Bearer <manageKey>`. Sharing the URL never shares editing permission.

Mutations require the exact ETag in `If-Match`. The helper fetches it automatically. Upload and replacement retries can use a random `Idempotency-Key` (32–128 characters, e.g. a UUID). Reuse the same key for identical input for up to 24 hours. Treat it as a temporary secret because it can recover a creation response. Cached responses are encrypted with `HTMLINKS_SECRET`.

See the running [/docs](http://localhost:3000/docs) and [/api/openapi](http://localhost:3000/api/openapi). There is no public list of documents. The CLI `list` command reads your local saved records.

## What works

- Self-contained UTF-8 `.html`/`.htm`, up to 10 MiB.
- Inline styles/scripts, embedded images/fonts, local charts, and slide navigation.
- Unlisted links, passwords, optional expiry, revisions, rollback, deletion and restore.
- Sandboxed document delivery on the app domain, and private storage; PostgreSQL metadata.
- Filesystem or Supabase Storage, with Supabase Postgres supported.

External scripts, API calls, browser storage, forms, popups, nested frames, PDF/PPTX/DOCX, ZIP bundles, and multi-file sites are not supported. Passwords gate delivery, not copying by authorized readers. Default deletion retention is seven days.

## Development and checks

```sh
npm ci
npm run init
docker compose -p htmlinks-dev -f compose.yaml -f compose.dev.yaml up db -d
npm run db:migrate
npm run dev
```

To test the production app locally, build and run one server:

```sh
npm run build
npm start
```

Do not build into `.next` while a dev server is using it.

The landing page's HTML examples live in `examples/`. After editing them, run
`npm run examples:sync` to refresh the embedded previews and `/examples/*` routes.
Each document stays self-contained, with inline CSS and JavaScript, so the same
file can be uploaded through the skill.

The showcase follows one idea through `idea.html`, `technical.html`, and
`presentation.html`. The technical design embeds an Archify-generated SVG;
its diagram source and SVG live in `examples/diagrams/`. The sync command
refreshes that inline diagram before rebuilding the previews.

```sh
npm run release:check
npm run check:integration
npm run check:skill-install
```

Integration checks create a disposable database on a loopback PostgreSQL service and launch one web service on port 4310. They test anonymous publishing, per-document permissions, encrypted retry responses, password revocation, source/history access, conflicts, recovery, the installed skill, and same-domain password delivery and sandboxing. The runner stops its servers and drops the test database. `-- --keep-database` preserves it for manual inspection.

## Managed hosting

The skill supports managed hosting and self-hosting. A public managed service is not configured in this checkout. Set `MANAGED_URL` to the actual public managed origin before launch for the instance-served helper. The GitHub helper’s managed default must also be set to that real origin before promoting public managed hosting; the current loopback default is for development. No production domain is invented or deployed by this checkout.

For Supabase, use the application-only `compose.cloud.yaml` profile with Supabase Postgres and a **private** Storage bucket. Supabase Auth is not required. See [deployment and backups](DEPLOYMENT.md).

[MIT license](../LICENSE) · [Contributing](../CONTRIBUTING.md) · [Security](../SECURITY.md) · [Design notes](DESIGN.md)

Source: [michael-elkabetz/HTMLinks](https://github.com/michael-elkabetz/HTMLinks).
