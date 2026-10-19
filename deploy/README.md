# Run HTMLinks with Docker

Requires Docker Engine with Docker Compose v2.20+ (or Docker Desktop), and a POSIX shell on Linux or macOS. The server needs no Node.js installation or source checkout. On Windows, run these commands in WSL2 with Docker Desktop integration enabled.

From the extracted `htmlinks` directory:

```sh
sh setup.sh
docker compose up -d --wait
```

Open http://localhost:3000. The setup command generates private `.env` configuration using the application image. Rerunning it preserves your existing settings and secrets. PostgreSQL and uploads persist in Docker volumes. `docker compose down` keeps them; `docker compose down -v` destroys them.

For a public instance, initialize with your HTTPS origin:

```sh
sh setup.sh --url https://htmlinks.example.com
```

Put a TLS reverse proxy in front of `127.0.0.1:3000`. This command configures the URL; it does not configure DNS, TLS, or a proxy. See the [deployment guide](https://github.com/michael-elkabetz/HTMLinks/blob/main/docs/DEPLOYMENT.md) for Caddy, request limits, and trusted proxy settings. For a busy local port, use `sh setup.sh --url http://localhost:3300` before the first start. If `.env` already exists, edit `APP_URL` and `HTMLINKS_PORT` there instead.

Install the [publishing skill](https://github.com/michael-elkabetz/HTMLinks#quick-start) on your agent's computer and choose your instance URL. The publishing helper requires Node.js 22.22+ on that computer.

## Upgrade an existing installation

Read the target release notes and the [backup instructions](https://github.com/michael-elkabetz/HTMLinks/blob/main/docs/DEPLOYMENT.md#back-up-and-restore). Back up PostgreSQL, uploads, and `.env` before migrating.

Download and extract the new release bundle **to a separate directory**. Review and copy its `compose.yaml`, `compose.cloud.yaml`, and `setup.sh` into your existing installation directory. Keep your `.env` and custom proxy settings. Set `HTMLINKS_IMAGE` in `.env` to the exact image tag printed in the release notes (the new bundle's `.env.example` also contains it).

Run from the original installation directory, with its original Compose project name or `-p` override:

```sh
docker compose pull
docker compose stop web maintenance
docker compose rm -f migrate
docker compose up -d --wait
docker compose logs --tail=50 migrate web maintenance
```

The migration must succeed before web and maintenance start. If it fails, leave those services stopped and investigate the migration logs. PostgreSQL remains on version 17; major database upgrades require their own migration procedure.

The `hstore` project name, database identity, and volume names deliberately remain compatible with existing installations. Changing the directory is safe only when you preserve the original project identity and any explicit project override. Never regenerate an existing instance secret.

If a migration makes the previous application incompatible, restore the coordinated database/uploads backup and original secrets into an isolated instance running the previous image. Verify the restored documents before switching traffic. Retagging the application alone does not undo schema changes.

## Existing Supabase infrastructure

The included `compose.cloud.yaml` runs application services against your external PostgreSQL database and private Supabase Storage bucket. Configure `.env` using the [Supabase deployment guide](https://github.com/michael-elkabetz/HTMLinks/blob/main/docs/DEPLOYMENT.md#supabase), then use `docker compose -f compose.cloud.yaml` for all operations. It does not provision Supabase for you.

## Troubleshooting

```sh
docker compose ps -a
docker compose logs --tail=100 migrate web maintenance
```

An image pull must work without registry login. If it does not, confirm the image version exists and the GitHub package is public. Keep `.env`, backups, document management keys, and uploaded HTML private. Back up your agent's `~/.config/htmlinks/` directory separately to preserve editing access.
