# Security

HTMLinks accepts anonymous HTML uploads. Editing is authorized by a high-entropy, per-document management key; the database stores its hash. The API returns the key on creation, and the bundled skill saves it locally with private permissions and omits it from output. Sharing URLs grant no editing rights. There is no account-recovery or public document index.

An optional random retry key can recover a creation response for 24 hours. Treat it as a temporary credential. These cached responses are AES-256-GCM encrypted using `HTMLINKS_SECRET`; preserve that secret when restarting the instance. Document passwords use Argon2id with bounded hashing concurrency. Reader grants are document-scoped and invalidated by access changes or deletion.

Uploaded HTML never enters the landing-page DOM. Shared pages use the app's origin under `/rendered/`. Uploaded content runs in a script-capable opaque iframe sandbox without `allow-same-origin`. Raw responses also carry a CSP sandbox when opened directly, so a same-domain URL does not grant the document the app's origin. External resource loads, API requests, forms, nested frames, popups, and parent access are blocked by the supported policy. Reader cookies are HttpOnly and scoped to the document's path. Never remove the iframe or response sandbox to enable a document feature.

Internet deployment requires HTTPS, a trusted reverse proxy, appropriate upload/bandwidth limits, monitoring, and an abuse/takedown process. Enable `TRUST_PROXY` only when your ingress REPLACES forwarding headers. Otherwise requests intentionally share a conservative source bucket. Service-role Supabase credentials and database URLs stay server-side. Keep the private `htmlinks` schema out of exposed Data API schemas.

Password protection gates delivery, not copying by authorized readers or end-to-end encryption. A document's content can be deceptive even inside a sandbox. Access changes cannot recall already downloaded bytes. Soft deletion revokes future delivery immediately; restore is limited to the configured retention period.

Do not post credentials, private documents, or exploit details publicly. The repository owner must configure private security reporting before public release. Until then, contact your instance operator through an existing private channel. No security email address is invented by this checkout.
