import { config } from "@/lib/config";
function quote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
export async function GET() {
  const origin = config().app;
  const script = `#!/bin/sh
set -eu
case "\${1:-codex}" in
  claude) destination='.claude/skills/htmlinks' ;;
  codex|other) destination='.agents/skills/htmlinks' ;;
  *) printf '%s\\n' 'Choose claude, codex, or other.' >&2; exit 1 ;;
esac
mkdir -p "$destination/scripts"
skill_tmp=$(mktemp "$destination/.skill.XXXXXX")
helper_tmp=$(mktemp "$destination/scripts/.helper.XXXXXX")
trap 'rm -f "$skill_tmp" "$helper_tmp"' EXIT HUP INT TERM
curl -fsSL --max-time 30 ${quote(origin + "/skill/SKILL.md")} -o "$skill_tmp"
curl -fsSL --max-time 30 ${quote(origin + "/skill/scripts/htmlinks.mjs")} -o "$helper_tmp"
chmod 644 "$skill_tmp" "$helper_tmp"
mv "$skill_tmp" "$destination/SKILL.md"
mv "$helper_tmp" "$destination/scripts/htmlinks.mjs"
printf '%s\\n' 'HTMLinks installed. Reload your agent’s skills, then ask it to publish an HTML file.'
`;
  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
