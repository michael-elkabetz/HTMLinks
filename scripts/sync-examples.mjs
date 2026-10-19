import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
const root = new URL("../", import.meta.url);
const examples = {};
const diagram = await readFile(
  new URL("examples/diagrams/publishing.svg", root),
  "utf8",
);
const mobileDiagram = await readFile(
  new URL("examples/diagrams/publishing-mobile.svg", root),
  "utf8",
);
const inlineDiagrams = [
  diagram.replace(
    'class="archify-diagram"',
    'class="archify-diagram diagram-landscape"',
  ),
  mobileDiagram
    .replace(
      'class="archify-diagram"',
      'class="archify-diagram diagram-portrait"',
    )
    .replace(/(\s)id="([^"]+)"/g, '$1id="mobile-$2"')
    .replace(/url\(#([^)]+)\)/g, "url(#mobile-$1)")
    .replace(
      /aria-labelledby="([^"]+)"/g,
      (_, ids) =>
        `aria-labelledby="${ids
          .split(" ")
          .map((id) => `mobile-${id}`)
          .join(" ")}"`,
    ),
].join("\n");
const technicalUrl = new URL("examples/technical.html", root);
const technical = await readFile(technicalUrl, "utf8");
await writeFile(
  technicalUrl,
  await format(
    technical.replace(
      /<!-- archify:start -->[\s\S]*?<!-- archify:end -->/,
      () => `<!-- archify:start -->\n${inlineDiagrams}\n<!-- archify:end -->`,
    ),
    { parser: "html" },
  ),
);
for (const kind of ["idea", "technical", "design", "presentation", "report"]) {
  examples[kind] = await readFile(
    new URL(`examples/${kind}.html`, root),
    "utf8",
  );
}
const source = `// Generated from examples/*.html. Refresh with npm run examples:sync.\nexport const examples = ${JSON.stringify(examples)};\nexport type ExampleKind = keyof typeof examples;\n`;
await writeFile(
  new URL("src/lib/examples.ts", root),
  await format(source, { parser: "typescript" }),
);
console.log("Synced the self-contained example documents and Archify embed.");
