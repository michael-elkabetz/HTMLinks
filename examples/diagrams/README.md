# Publishing diagram

These diagrams illustrate the sample technical design. They were generated with
[Archify](https://github.com/tt-a1i/archify) 3.0.1 (MIT), then embedded as inline SVG
so the HTML example works without network access or nested frames.

- `publishing.architecture.json` defines the landscape layout.
- `publishing-mobile.architecture.json` defines the portrait layout.
- `publishing.svg` and `publishing-mobile.svg` contain the generated drawings.

Run Archify's `finalize architecture` command against the corresponding JSON to
regenerate a checked HTML artifact. Copy its diagram SVG into the matching SVG
file, retaining the `archify-diagram` class. Then run `npm run examples:sync`.
That command inlines both layouts, prefixes the portrait's element IDs to avoid
collisions, and refreshes the example route and landing-page preview.

The technical document supplies diagram colors and component inspection controls.
The SVG files are source assets for that document, rather than standalone viewers.
