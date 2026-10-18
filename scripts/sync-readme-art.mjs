import { writeFile } from "node:fs/promises";
import { renderShareStory } from "./share-story.mjs";

const artwork = await renderShareStory();
const definitions = artwork.match(/<defs>[\s\S]*?<\/defs>/)?.[0];
const desktop = artwork.match(/<svg class="story-desktop"[\s\S]*?<\/svg>/)?.[0];
if (!definitions || !desktop)
  throw new Error("The sharing illustration is missing.");
const colors = {
  paper: "#ffffff",
  wash: "#dfeced",
  ink: "#2c414a",
  accent: "#176d83",
  route: "#91b1bb",
  "code-ink": "#b3d8db",
};
const svg = desktop
  .replace(
    '<svg class="story-desktop"',
    '<svg xmlns="http://www.w3.org/2000/svg" fill="#2c414a" font-family="Arial, Helvetica, sans-serif"',
  )
  .replace(
    /(<svg[^>]*>)/,
    `$1\n<rect width="1120" height="385" fill="#f8faf9"/>\n${definitions}\n`,
  )
  .replace(/var\(--([a-z-]+)\)/g, (_, name) => {
    if (!colors[name]) throw new Error(`Unknown illustration color: ${name}`);
    return colors[name];
  })
  .replaceAll("currentColor", colors.ink);

await writeFile(
  new URL("../docs/assets/readme-solution.svg", import.meta.url),
  `${svg}\n`,
);
console.log("Synced the README solution SVG from the landing-page artwork.");
