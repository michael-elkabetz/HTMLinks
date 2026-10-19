import Link from "next/link";
import { SiteHeader } from "@/components/brand";
import { InstallGuide } from "@/components/install-guide";
import { config } from "@/lib/config";
import { pageMetadata, webPageSchema } from "@/lib/seo";
import { jsonLd } from "@/lib/seo-policy";
import { guides } from "@/lib/guides";
import { selfHostCommand } from "@/lib/deployment";
export const dynamic = "force-dynamic";
const title = "HTML Publishing Setup, CLI and API";
const description =
  "Install HTMLinks for your coding agent, publish and update HTML, configure passwords, explore the REST API, and deploy your own instance.";
export function generateMetadata() {
  return pageMetadata("/docs", title, description);
}
const routes = [
  ["POST", "/documents", "Upload a file. No authentication required."],
  ["GET", "/documents/:id", "Read author metadata and current ETag."],
  [
    "PATCH",
    "/documents/:id",
    "Change title, category, access, password, or expiry.",
  ],
  ["PUT", "/documents/:id/content", "Replace HTML and preserve its URL."],
  ["GET", "/documents/:id/source", "Download HTML source."],
  ["GET", "/documents/:id/revisions", "List previous revisions."],
  [
    "GET",
    "/documents/:id/revisions/:revisionId/source",
    "Download a previous revision.",
  ],
  [
    "POST",
    "/documents/:id/rollback",
    "Republish a revision as a new revision.",
  ],
  [
    "DELETE",
    "/documents/:id",
    "Delete immediately; recoverable during retention.",
  ],
  ["POST", "/documents/:id/restore", "Restore within the retention window."],
];
export default function Docs() {
  const origin = config().app;
  return (
    <div className="docs-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(webPageSchema("/docs", title, description)),
        }}
      />
      <SiteHeader />
      <main id="main" className="docs-layout">
        <nav className="docs-nav" aria-label="Documentation">
          <a href="#guides">Publishing guides</a>
          <a href="#skill">Agent skill</a>
          <a href="#api">REST API</a>
          <a href="#keys">Management keys</a>
          <a href="#html">Supported HTML</a>
          <a href="#self-host">Self-hosting</a>
          <a href="#supabase">Supabase</a>
        </nav>
        <article className="docs-content">
          <h1>Publish and update HTML with HTMLinks.</h1>
          <p>
            Documents made with coding agents often stay as local files.
            HTMLinks gives you a simple skill to upload an HTML document and get
            a shareable link. Update it later, keep the same link, and add a
            password when needed.
          </p>
          <p>
            HTMLinks accepts HTML directly from your agent. Uploading needs no
            account or API key. Use free managed hosting or point the same skill
            at your own server.
          </p>
          <section id="guides">
            <h2>Choose a publishing guide.</h2>
            <ul>
              {guides(origin).map((guide) => (
                <li key={guide.path}>
                  <Link href={guide.path}>{guide.title}</Link>
                </li>
              ))}
            </ul>
          </section>
          <section id="skill">
            <h2>Install the HTMLinks Agent Skill.</h2>
            <p>
              Choose your agent, run the GitHub install command in your project
              directory, and reload your agent’s skills. On first use, it asks
              for managed hosting or your self-hosted server and remembers your
              answer.
            </p>
            <InstallGuide />
            <p>
              Add <code>--global</code> to install across projects. The
              repository’s <code>skills/htmlinks/</code> folder includes both
              the skill instructions and the standalone helper. Installing the
              application or its dependencies is unnecessary.
            </p>
            <p>
              Ask your agent to publish a selected HTML file. It returns a
              sharing URL and stores the document’s private management key
              locally. No sign-in or token setup follows installation.
            </p>
            <p>
              Run <code>htmlinks.mjs config</code> to see the saved destination.
              Change it with <code>config --hosting managed</code> or{" "}
              <code>
                config --hosting self-hosted --url https://your-server
              </code>
              . An explicit <code>HTMLINKS_URL</code> overrides the destination
              for one invocation. Preferences are stored locally; updating the
              skill preserves them.
            </p>
            <p>
              Ask to password-protect a document before upload. The skill uses{" "}
              <code>--access password --password-stdin</code> with secure
              password input. For an existing document, use{" "}
              <code>access &lt;id&gt; --mode password --password-stdin</code>.
              Content updates preserve the password and URL.
            </p>
          </section>
          <section id="api">
            <h2>Publish and update through the REST API.</h2>
            <p>
              Base: <code>{origin}/api/v1</code>. Create a document with
              multipart <code>file</code> and optional JSON{" "}
              <code>metadata</code> fields.
            </p>
            <pre>
              <code>{`curl '${origin}/api/v1/documents' \\\n  -F 'file=@./design.html' \\\n  -F 'metadata={"title":"System design","access":"link"}'`}</code>
            </pre>
            <p>
              Creation returns <code>id</code>, <code>url</code>,{" "}
              <code>manageKey</code>, <code>revision</code>, and{" "}
              <code>etag</code>. Keep the management key private. Every later
              operation on that document requires{" "}
              <code>Authorization: Bearer &lt;manageKey&gt;</code>.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path under /api/v1</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(([m, p, d]) => (
                  <tr key={m + p}>
                    <td>
                      <code>{m}</code>
                    </td>
                    <td>
                      <code>{p}</code>
                    </td>
                    <td>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              There is no public document list, account API, or management
              dashboard. The CLI’s <code>list</code> command lists records saved
              on your own machine.
            </p>
            <p>
              Metadata accepts <code>title</code>, <code>category</code>{" "}
              (design, presentation, technical, report, other),{" "}
              <code>access</code> (link, password, or private), optional{" "}
              <code>password</code> (8–256 characters), and nullable{" "}
              <code>expiresAt</code> (ISO timestamp). Passwords belong in a
              protected request body, never URLs or command arguments.
            </p>
            <p>
              Updates, rollback, deletion, and restore require{" "}
              <code>If-Match</code> with the exact current ETag. Missing
              preconditions return 428; stale edits return 412. The CLI fetches
              this automatically. Rollback accepts{" "}
              <code>{'{"revisionId":"…"}'}</code>.
            </p>
            <p>
              For upload retries, use a random <code>Idempotency-Key</code> of
              32–128 characters (a UUID works). Reuse it with the same file and
              metadata for up to 24 hours. Treat this retry key as a temporary
              secret: it can recover the creation response. Cached responses are
              encrypted at rest. Different input returns 409.
            </p>
            <p>
              Errors use <code>{"{error: {code, message, requestId}}"}</code>.
              Uploads are limited to 10 MiB, with rate and instance-storage
              limits. Operators can lower the limits.{" "}
              <a href="/api/openapi">Download OpenAPI</a>.
            </p>
          </section>
          <section id="keys">
            <h2>Sharing links and private management keys.</h2>
            <p>
              The sharing URL lets recipients read a link-access document. The
              management key controls that one document’s metadata, source,
              revisions, updates, and deletion. Neither credential grants access
              to anyone else’s documents.
            </p>
            <p>
              The skill stores keys in <code>~/.config/htmlinks/</code> using
              private file permissions. It omits them from its output. Back up
              that folder; losing a key means losing edit/delete access. There
              is no account recovery flow. An operator can still remove abusive
              content through the database.
            </p>
            <p>
              Password protection prevents delivery until a recipient unlocks
              the document. Changing access or deleting revokes future requests,
              including existing viewer sessions. Authorized readers can still
              save copies. Private mode requires a management-key-authorized
              preview handoff through <code>POST /documents/:id/preview</code>.
            </p>
          </section>
          <section id="html">
            <h2>Supported HTML and sandbox limits.</h2>
            <p>
              Upload UTF-8 <code>.html</code> or <code>.htm</code>. Inline
              scripts and CSS work. Embed images and fonts as data URLs. Slide
              navigation and local charts can run inside the viewer’s isolated
              sandbox.
            </p>
            <p>
              External scripts, API requests, browser storage, forms, popups,
              and nested frames are blocked. Native PDF, PPTX, DOCX, ZIP, and
              multi-file sites are not accepted. Try the real{" "}
              <a href="/examples/presentation" target="_blank" rel="noreferrer">
                HTML slide example
              </a>
              .
            </p>
          </section>
          <section id="self-host">
            <h2>Self-host with Docker and PostgreSQL.</h2>
            <p>
              Self-hosting currently supports local PostgreSQL with files stored
              on disk, or Supabase for both PostgreSQL and file storage. You run
              HTMLinks on your own server with either option.
            </p>
            <p>
              Install Docker with Compose, then download the deployment bundle.
              Setup generates your private <code>.env</code> configuration
              inside Docker. The server needs no Node.js installation or source
              checkout:
            </p>
            <pre>
              <code>{selfHostCommand}</code>
            </pre>
            <p>
              Open <code>http://localhost:3000</code> and install the skill from
              that instance. Shared documents open under <code>/rendered/</code>{" "}
              on the same origin. There is no owner setup, account registration,
              or API-token configuration.
            </p>
            <p>
              Choose self-hosted in the skill’s first-use question and supply
              your app origin, such as <code>http://localhost:3000</code>. The
              same skill and API work for both hosting options.{" "}
              <a
                href="https://github.com/michael-elkabetz/HTMLinks"
                target="_blank"
                rel="noreferrer"
              >
                Source on GitHub
              </a>
              .
            </p>
            <p>
              Compose includes PostgreSQL, migrations, private file storage, one
              web service, and maintenance. Named volumes preserve data.
              Production requires HTTPS. Set <code>APP_URL</code> to your
              canonical origin. Shared pages use <code>/rendered/</code> on that
              domain, with uploaded HTML kept in an opaque sandbox. Configure
              upload limits and a trusted proxy before exposing an
              anonymous-upload service.
            </p>
            <p>
              Back up both PostgreSQL and uploaded files, plus{" "}
              <code>HTMLINKS_SECRET</code> for in-flight retry responses.{" "}
              <code>docker compose down</code> retains data; removing volumes
              deletes it.
            </p>
          </section>
          <section id="supabase">
            <h2>Configure Supabase database and storage.</h2>
            <p>
              Create a Supabase project and a private Storage bucket named{" "}
              <code>htmlinks</code>. In your extracted deployment directory, run{" "}
              <code>sh setup.sh</code> if you haven’t already, then update these
              values in <code>.env</code>:
            </p>
            <pre>
              <code>{`# Your Supabase Postgres connection string
DATABASE_URL=postgres://...
STORAGE_DRIVER=supabase

# Your Supabase project URL and server-side service-role key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# The name of your private Storage bucket
SUPABASE_BUCKET=htmlinks`}</code>
            </pre>
            <p>
              Then start HTMLinks with the Supabase configuration. It connects
              to your Supabase database and storage and runs migrations for you:
            </p>
            <pre>
              <code>docker compose -f compose.cloud.yaml up -d --wait</code>
            </pre>
            <p>
              If migrations need a separate database connection, also set{" "}
              <code>MIGRATION_DATABASE_URL</code> to a direct connection string.
              For a public server, set <code>APP_URL</code> to your canonical
              HTTPS origin. The site, API, and shared pages under{" "}
              <code>/rendered/</code> use that origin.
            </p>
            <p>
              Keep the bucket private and the service-role key on your server.
              Leave the <code>htmlinks</code> schema out of the exposed Data API
              schemas. You don’t need Supabase Auth. When using the agent skill,
              choose self-hosted and enter your HTMLinks app URL.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
