# Contributing

Use Node.js 22.22+ and npm. Follow [the usage guide](docs/USAGE.md#development-and-checks) for development and verification. Use public dependencies and original project code and assets.

The frontend is a product/installation site, not a management app. Do not introduce account setup, workspaces, or API-token onboarding. The skill uploads anonymously and holds each document's management capability locally. Changes to document behavior must work through the API and both storage profiles.

Keep routes in `src/app`, components in `src/components`, and server-only modules in `src/lib`. Never weaken HTML isolation for compatibility. Run `npm run release:check` and `npm run check:integration` with local PostgreSQL before submitting. Keep OpenAPI, docs, and the distributed skill aligned.

Do not commit `.env`, management keys, retry keys, original private HTML, backups, test fixtures, internal audits, working plans, or review screenshots. Keep public documentation limited to what users and contributors need. Fontsource bundles font license notices; preserve those notices in redistribution.
