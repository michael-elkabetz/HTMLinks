# Shared pages on the main domain

The web service can serve the site, publishing API, password screens, and shared documents on one origin:

```dotenv
APP_URL=https://www.htmlinks.com
```

`APP_URL` is the only origin setting for the site, publishing API, and shared pages. Links use `/rendered/<public-id>`; `/raw`, `/unlock`, and `/handoff` use the same document prefix. Existing main-domain `/d/` paths redirect to `/rendered/`. One web service handles publishing and document delivery. Changing the configured origin does not replace document IDs, revisions, management keys, or passwords; fetch current metadata to get the new URL.

Uploaded HTML remains outside the trusted page DOM. The wrapper uses an iframe with `sandbox="allow-scripts"`, and raw responses carry `Content-Security-Policy: sandbox allow-scripts` without `allow-same-origin`. Content therefore executes with an opaque origin even when its URL is on the main domain. Network access, forms, nested frames, popups, and parent access remain blocked. Document reader cookies are HttpOnly, Secure on HTTPS, and scoped to `/rendered/<public-id>`.

When upgrading from a deployment with a separate content host, point clients at the app origin and retrieve document metadata to get the current `/rendered/` URL. The app does not configure or route a second content host.

The password screen and viewer header use HTMLinks' existing logo, Hanken Grotesk font, off-white background, slate text, and teal accent. The document itself is still the author's HTML.
