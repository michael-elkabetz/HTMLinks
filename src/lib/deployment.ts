import { version } from "../../package.json";

export const selfHostCommand = `curl -fL https://github.com/michael-elkabetz/HTMLinks/releases/download/v${version}/htmlinks-${version}.tar.gz -o htmlinks.tar.gz
tar -xzf htmlinks.tar.gz
cd htmlinks
sh setup.sh
docker compose up -d --wait`;
