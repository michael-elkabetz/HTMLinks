#!/bin/sh
set -eu

# The release packager pins this to the image built for that release.
DEFAULT_IMAGE=ghcr.io/michael-elkabetz/htmlinks:0.1.0
image=${HTMLINKS_IMAGE:-$DEFAULT_IMAGE}

if [ -e .env ]; then
  echo '.env already exists; nothing changed. Edit it directly to change settings.'
  exit 0
fi

docker compose version >/dev/null
# Match the host user so Linux bind-mounted configuration is not owned by root.
docker run --rm --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$(pwd),dst=/setup" \
  --workdir /setup --entrypoint node \
  "$image" /app/scripts/init.mjs --image "$image" "$@"
