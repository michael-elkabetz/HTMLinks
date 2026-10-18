import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { transpileModule, JsxEmit, ModuleKind } from "typescript";

export async function renderShareStory() {
  const source = await readFile(
    new URL("../src/components/share-story.tsx", import.meta.url),
    "utf8",
  );
  const { outputText } = transpileModule(source, {
    compilerOptions: { jsx: JsxEmit.ReactJSX, module: ModuleKind.ESNext },
  });
  const require = createRequire(import.meta.url);
  const runtime = pathToFileURL(require.resolve("react/jsx-runtime")).href;
  const code = outputText.replace(
    '"react/jsx-runtime"',
    JSON.stringify(runtime),
  );
  const { ShareStory } = await import(
    `data:text/javascript,${encodeURIComponent(code)}`
  );
  return renderToStaticMarkup(ShareStory())
    .replace(/<figcaption[\s\S]*?<\/figcaption>/, "")
    .replace('<path d="M945 365C945 395 560 335 560 385"></path>', "")
    .replace("M192 465C192 480 180 478 180 490", "");
}
