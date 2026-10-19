import Link from "next/link";
import { config } from "@/lib/config";
import { guides } from "@/lib/guides";

export function ProductDetails() {
  const settings = config();
  const maxMiB = Number((settings.maxBytes / 1024 / 1024).toFixed(2));
  const questions = [
    [
      "Do I need an account or API key?",
      "No account or API key is needed to upload. The publishing skill requires Node.js 22.22+ and saves a separate management key locally for each document.",
    ],
    [
      "Can I update a document without changing its link?",
      "Yes. Content updates keep the sharing URL and access settings. Revision history and rollback let you republish earlier versions.",
    ],
    [
      "Can I protect a link with a password?",
      "Yes. Ask your agent to password-protect the upload. Password protection gates delivery; authorized readers can still save copies. Anyone with an unprotected, unlisted link can read it.",
    ],
    [
      "Does JavaScript work?",
      "Inline JavaScript and CSS work inside an isolated sandbox. Embed images and fonts in the file. External scripts, network calls, browser storage, forms, popups, and nested frames are blocked.",
    ],
    [
      "How long do documents remain available?",
      "Documents can have an expiry date or be deleted by their author or operator. Deleted documents can be restored within the operator-configured retention window, seven days by default. That window is not an uptime or permanent-storage guarantee.",
    ],
    [
      "What if I lose my editing key?",
      "Back up ~/.config/htmlinks/ privately. A sharing link cannot recover editing access, and there is no account recovery flow. The server operator can remove abusive content through the database.",
    ],
  ];
  return (
    <section className="publishing-info" aria-labelledby="publishing-title">
      <div className="product-definition">
        <h2 id="publishing-title">HTML publishing for coding agents.</h2>
        <p>
          HTMLinks is an open-source publishing tool for Claude Code, Codex, and
          other coding agents that support Agent Skills. Share reports,
          proposals, and presentations as browser links. Revise the file and
          keep the URL, or run HTMLinks on your own infrastructure.
        </p>
        <dl className="product-facts">
          <div>
            <dt>Supported files</dt>
            <dd>
              Self-contained UTF-8 .html and .htm, up to {maxMiB} MiB on this
              instance. PDF, PPTX, DOCX, ZIP, and multi-file sites are
              unsupported.
            </dd>
          </div>
          <div>
            <dt>Hosting</dt>
            <dd>
              Use free managed hosting or self-host with Docker Compose and
              PostgreSQL. The source is MIT-licensed; self-hosting
              infrastructure has its own costs.
            </dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>
              Unlisted links, password protection, or private previews
              authorized by the management key. Shared documents are marked
              noindex.
            </dd>
          </div>
        </dl>
      </div>
      <div>
        <h2>Questions before you publish.</h2>
        <div className="publishing-faq">
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
      <div>
        <h2>From file to shared page.</h2>
        <ul className="guide-links">
          {guides(settings.app).map((guide) => (
            <li key={guide.path}>
              <Link href={guide.path}>
                {guide.title}
                <span aria-hidden="true"> ↗</span>
              </Link>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/about">About HTMLinks and its maintainer</Link>
        </p>
      </div>
    </section>
  );
}
