import Link from "next/link";
import type { ReactNode } from "react";
import { selfHostCommand } from "./deployment";

export type Guide = {
  path: string;
  title: string;
  description: string;
  sections: { id: string; title: string; content: ReactNode }[];
};

const helper = "node .agents/skills/htmlinks/scripts/htmlinks.mjs";

export function guides(origin: string): Guide[] {
  return [
    {
      path: "/guides/share-html-file",
      title: "Share an HTML file as a link",
      description:
        "Publish a self-contained HTML report with HTMLinks, share its URL, and update it without changing the link. Includes a sample and troubleshooting.",
      sections: [
        {
          id: "prepare",
          title: "Start with a self-contained file",
          content: (
            <>
              <p>
                HTMLinks turns a local HTML file into a page people can open in
                their browser. It does not generate the document: your agent or
                editor creates it first. Inline CSS, scripts, and embedded
                images can stay interactive.
              </p>
              <p>
                Use Node.js 22.22+ for the publishing helper. To try a
                maintained sample, download the{" "}
                <a href="/examples/idea" target="_blank" rel="noreferrer">
                  idea document
                </a>
                :
              </p>
              <pre>
                <code>{`curl -fL '${origin}/examples/idea' -o report.html`}</code>
              </pre>
              <p>
                To publish your own report, save it as UTF-8 HTML. Embed its
                assets; external scripts and network requests are blocked. See{" "}
                <Link href="/docs#html">supported HTML</Link> for the full
                constraints and <Link href="/docs/agents">agent setup</Link> to
                install the skill.
              </p>
            </>
          ),
        },
        {
          id: "publish",
          title: "Publish and share",
          content: (
            <>
              <p>
                After installation, ask your agent: “Use HTMLinks to publish
                ./report.html. Anyone with the link can read it.” On first use,
                choose managed hosting or give it your self-hosted server URL.
                The agent saves your choice and returns a sharing URL.
              </p>
              <p>
                For a project-local Codex installation, you can also run the
                helper yourself from the project root:
              </p>
              <pre>
                <code>{`${helper} config --hosting managed --url https://www.htmlinks.com\n${helper} upload ./report.html`}</code>
              </pre>
              <p>
                For your own server, use{" "}
                <code>config --hosting self-hosted --url {origin}</code>. The
                command above explicitly selects the public managed service. The
                result includes a document ID and sharing URL; the helper saves
                the editing key locally without printing it. Share the URL with
                recipients, who only need a browser.
              </p>
            </>
          ),
        },
        {
          id: "update",
          title: "Update the file and keep the URL",
          content: (
            <>
              <p>
                Edit the local HTML and ask: “Update the HTMLinks document I
                published with ./report.html. Keep the same link.” Use the same
                computer and saved key, or restore your private key backup
                first. Content updates preserve the sharing URL and access
                settings.
              </p>
              <p>
                The CLI uses <code>update DOCUMENT_ID ./report.html</code>;
                replace <code>DOCUMENT_ID</code> with the ID returned on upload.
                Use <code>revisions DOCUMENT_ID</code> to inspect revision
                history and{" "}
                <code>rollback DOCUMENT_ID --revision REVISION_ID</code> to
                republish a previous revision.
              </p>
              <p>
                If the agent cannot find the skill, reload its skills and
                confirm you installed into this project or used the installer’s
                global option. If upload fails, check <code>config</code> for
                the saved origin, file size, and server availability. A lost
                management key cannot be recovered from the sharing URL.
              </p>
              <p>
                Need restricted access? Follow the{" "}
                <Link href="/guides/password-protected-html">
                  password-protected HTML guide
                </Link>
                .
              </p>
            </>
          ),
        },
      ],
    },
    {
      path: "/docs/agents",
      title: "Publish HTML from Claude Code or Codex",
      description:
        "Install the HTMLinks Agent Skill for Claude Code or Codex, choose your hosting destination, and publish your first HTML artifact without an account.",
      sections: [
        {
          id: "install",
          title: "Install for your coding agent",
          content: (
            <>
              <p>
                The HTMLinks Agent Skill lets Claude Code and Codex upload,
                update, and password-protect HTML files using a standalone
                Node.js helper. You need Node.js 22.22+; installing the HTMLinks
                application is unnecessary for managed hosting.
              </p>
              <p>Run the matching command in your project:</p>
              <h3>Claude Code</h3>
              <pre>
                <code>
                  npx skills add michael-elkabetz/HTMLinks --skill htmlinks
                  --agent claude-code
                </code>
              </pre>
              <h3>Codex</h3>
              <pre>
                <code>
                  npx skills add michael-elkabetz/HTMLinks --skill htmlinks
                  --agent codex
                </code>
              </pre>
              <p>
                Reload the agent’s skills after installation. Add{" "}
                <code>--global</code> to install across projects. The helper is
                bundled with the skill and uses Node’s built-in modules.
              </p>
            </>
          ),
        },
        {
          id: "destination",
          title: "Choose hosting on first use",
          content: (
            <>
              <p>
                Ask: “Use HTMLinks to publish ./report.html through managed
                hosting at https://www.htmlinks.com.” The skill configures that
                destination and saves it locally. No account or API token is
                required to upload.
              </p>
              <p>
                For self-hosting, ask to publish to your server’s app origin
                instead. Do not supply a shared document URL as the server
                destination. The saved choice survives skill updates; an
                explicit <code>HTMLINKS_URL</code> overrides it for one
                invocation.
              </p>
              <p>
                The skill stores document management keys under{" "}
                <code>~/.config/htmlinks/</code>. Back up that directory
                privately. Sharing URLs grant reading access according to the
                document policy; they do not grant editing access.
              </p>
            </>
          ),
        },
        {
          id: "troubleshoot",
          title: "Check installation and saved preferences",
          content: (
            <>
              <p>
                For a project-local installation, the helper is typically under{" "}
                <code>.claude/skills/htmlinks/scripts/htmlinks.mjs</code> for
                Claude Code and{" "}
                <code>.agents/skills/htmlinks/scripts/htmlinks.mjs</code> for
                Codex. Global installs use the agent’s global skill directory.
                Inspect the installer output for the actual location.
              </p>
              <p>
                Run <code>node PATH_TO_HELPER config</code>, substituting the
                actual helper path. It reports the selected origin and
                configuration state without uploading. If an older installation
                points managed hosting at localhost, run{" "}
                <code>
                  config --hosting managed --url https://www.htmlinks.com
                </code>{" "}
                with that helper. Explicit self-hosted preferences remain yours
                to keep.
              </p>
              <p>
                If the agent cannot discover the skill, check the project/global
                destination and reload. If publishing fails, use{" "}
                <code>help</code> for the CLI contract, check Node’s version,
                and confirm the file is self-contained HTML. Continue with the{" "}
                <Link href="/guides/share-html-file">
                  complete sharing workflow
                </Link>{" "}
                or <Link href="/docs#api">REST API reference</Link>.
              </p>
            </>
          ),
        },
      ],
    },
    {
      path: "/docs/self-hosting",
      title: "Self-host HTMLinks with Docker",
      description:
        "Run HTMLinks with Docker Compose and PostgreSQL, configure your canonical HTTPS origin, connect the agent skill, and back up your documents.",
      sections: [
        {
          id: "start",
          title: "Start a local instance",
          content: (
            <>
              <p>
                HTMLinks is MIT-licensed and can run on your infrastructure.
                Docker Compose provides PostgreSQL, migrations, private upload
                storage, the web service, and maintenance. Install Docker with
                Compose; the server needs no Node.js installation or source
                checkout.
              </p>
              <pre>
                <code>{selfHostCommand}</code>
              </pre>
              <p>
                Open <code>http://localhost:3000</code>. The site, API, and
                shared pages under <code>/rendered/</code> use the same origin.
                Uploaded HTML executes in an opaque sandbox. There is no
                registration or owner setup step.
              </p>
            </>
          ),
        },
        {
          id: "connect",
          title: "Connect your agent to this instance",
          content: (
            <>
              <p>
                Install the <Link href="/docs/agents">Agent Skill</Link>, then
                choose self-hosted on first use and supply your server origin.
                You can also use the helper in this checkout:
              </p>
              <pre>
                <code>{`node skills/htmlinks/scripts/htmlinks.mjs config --hosting self-hosted --url http://localhost:3000\nnode skills/htmlinks/scripts/htmlinks.mjs upload examples/idea.html`}</code>
              </pre>
              <p>
                Recipients need access to that server to open shared links. A
                localhost link only works on the machine running the instance;
                configure a reachable HTTPS domain for remote recipients.
              </p>
            </>
          ),
        },
        {
          id: "production",
          title: "Configure public hosting and backups",
          content: (
            <>
              <p>
                Set <code>APP_URL</code> to your canonical HTTPS origin before
                starting production. The proxy validates that host, and
                generated links and canonical metadata use it. Configure your
                reverse proxy to preserve the intended host. Review
                upload/storage limits and enable <code>TRUST_PROXY</code> only
                behind ingress that replaces forwarded client headers.
              </p>
              <p>
                Public marketing-page indexing defaults to the managed HTMLinks
                domain. For an intentionally public self-hosted site, set{" "}
                <code>INDEX_PUBLIC_SITE=1</code>. Set it to <code>0</code> on
                staging/private deployments. This controls discovery signals,
                not access permissions; customer documents remain noindexed in
                either mode.
              </p>
              <p>
                Back up PostgreSQL, uploaded files, <code>HTMLINKS_SECRET</code>
                , and each author’s local management-key directory. Compose
                named volumes retain data when services stop; removing the
                volumes deletes it. Self-hosting has infrastructure costs even
                though the source license is free.
              </p>
              <p>
                For Supabase storage, use the{" "}
                <Link href="/docs#supabase">Supabase configuration</Link>. See
                the repository’s{" "}
                <a href="https://github.com/michael-elkabetz/HTMLinks/blob/main/docs/DEPLOYMENT.md">
                  deployment guide
                </a>{" "}
                for operations and{" "}
                <a href="https://github.com/michael-elkabetz/HTMLinks/blob/main/docs/RENDER.md">
                  Render instructions
                </a>{" "}
                for that platform.
              </p>
            </>
          ),
        },
      ],
    },
    {
      path: "/guides/password-protected-html",
      title: "Share HTML with password protection",
      description:
        "Password-protect an HTML report or presentation with HTMLinks. Learn how passwords, sharing URLs, content updates, and management keys work.",
      sections: [
        {
          id: "protect",
          title: "Choose protection before publishing",
          content: (
            <>
              <p>
                HTMLinks can require a password before delivering a shared HTML
                document. After{" "}
                <Link href="/docs/agents">installing the skill</Link>, ask:
                “Publish ./report.html with password protection. Ask me which
                password to use before uploading.”
              </p>
              <p>
                The skill arranges secure password input and sends it in the
                upload body. Passwords must be 8–256 characters. The helper uses{" "}
                <code>--access password --password-stdin</code>; do not put the
                password in a command argument or URL.
              </p>
              <p>
                Send recipients the returned sharing URL and provide the
                password through your chosen channel. Their browser displays a
                password gate. Anyone with an unlisted, unprotected link can
                read its content, so choose the access mode before distributing
                it.
              </p>
            </>
          ),
        },
        {
          id: "change",
          title: "Update content or change access",
          content: (
            <>
              <p>
                Ask your agent to update the published document with a revised
                HTML file. Content updates keep the same link and current
                password policy. You can also ask to change the password on an
                existing document.
              </p>
              <p>
                For the CLI, use{" "}
                <code>access DOCUMENT_ID --mode password --password-stdin</code>{" "}
                with your installed helper and the document ID. Keep the
                management key available locally. Changing access revokes
                existing viewer grants; readers must satisfy the new policy on
                future requests.
              </p>
            </>
          ),
        },
        {
          id: "limits",
          title: "Understand the boundaries",
          content: (
            <>
              <p>
                Password protection gates delivery; it cannot prevent an
                authorized reader from saving or copying a document they have
                already opened. It is not an account-based permission system.
              </p>
              <p>
                The sharing URL and password do not grant editing access. Only
                the separate management key authorizes updates and deletion.
                Back up <code>~/.config/htmlinks/</code> privately; there is no
                account recovery flow for lost keys. See{" "}
                <Link href="/docs#keys">
                  management keys and private previews
                </Link>{" "}
                for details.
              </p>
              <p>
                Deleting a document stops future reads. Restoration is possible
                during the operator-configured retention window, seven days by
                default. Do not use that restoration window as a promise of
                permanent backup.
              </p>
            </>
          ),
        },
      ],
    },
    {
      path: "/guides/html-presentations",
      title: "Publish an interactive HTML presentation",
      description:
        "Share an HTML slide deck with HTMLinks. Prepare self-contained slides, test sandbox compatibility, publish the deck, and update it at the same URL.",
      sections: [
        {
          id: "prepare",
          title: "Prepare slides as one HTML file",
          content: (
            <>
              <p>
                HTMLinks hosts a self-contained HTML presentation so recipients
                can open it in a browser. It accepts HTML, not native PowerPoint
                or PDF files. Export or create your slides as one UTF-8 HTML
                document with embedded assets.
              </p>
              <p>
                Try the{" "}
                <a
                  href="/examples/presentation"
                  target="_blank"
                  rel="noreferrer"
                >
                  interactive slide example
                </a>
                , or download it to publish your own test copy:
              </p>
              <pre>
                <code>{`curl -fL '${origin}/examples/presentation' -o presentation.html`}</code>
              </pre>
              <p>
                Keep navigation JavaScript and CSS inline. Embed fonts/images as
                data URLs and bundle any chart code into the document. CDN
                scripts, API calls, forms, browser storage, and nested frames
                cannot run in the viewer sandbox.
              </p>
            </>
          ),
        },
        {
          id: "publish",
          title: "Publish, review, and revise",
          content: (
            <>
              <p>
                After <Link href="/docs/agents">installing the skill</Link>, ask
                your agent: “Publish ./presentation.html with HTMLinks.” Choose
                your hosting destination on first use. Add a request for
                password protection if the deck should require it.
              </p>
              <p>
                Open the returned URL and test slide controls, keyboard
                navigation, charts, and mobile layout in the hosted viewer. If a
                feature fails, check whether it depends on a blocked external
                resource and embed that resource or simplify the feature.
              </p>
              <p>
                When the slides change, ask the agent to update the same
                document. The URL and access mode stay the same, and revision
                history lets you roll back. Follow the{" "}
                <Link href="/guides/share-html-file">
                  sharing and update guide
                </Link>{" "}
                for the CLI equivalents.
              </p>
            </>
          ),
        },
      ],
    },
  ];
}
