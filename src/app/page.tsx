import Link from "next/link";
import { Brand, SiteHeader } from "@/components/brand";
import { DocumentDemo } from "@/components/document-demo";
import { InstallGuide } from "@/components/install-guide";
import { CopyButton } from "@/components/copy-button";
import { ShareStory } from "@/components/share-story";
import { LandingJourney, SceneTransition } from "@/components/landing-journey";
import { ProductDetails } from "@/components/product-details";
import { pageMetadata, siteDescription, siteEntities } from "@/lib/seo";
import { jsonLd } from "@/lib/seo-policy";
export const dynamic = "force-dynamic";
export function generateMetadata() {
  return pageMetadata(
    "/",
    "HTML Publishing for AI Coding Agents",
    siteDescription,
  );
}
export default function Home() {
  const selfHostCommand =
    "git clone https://github.com/michael-elkabetz/HTMLinks.git\ncd HTMLinks\nnode scripts/init.mjs\ndocker compose up --build -d";
  return (
    <>
      <SiteHeader />
      <LandingJourney>
        <section className="hero-scene" id="story">
          <section className="intro">
            <h1>
              Your agent’s HTML.
              <br />
              One lasting link.
            </h1>
            <p>
              Publish HTML from Claude Code, Codex, or your coding agent. Share
              a browser link, update the file, and keep the same URL.
            </p>
            <div className="intro-actions">
              <a className="button" href="#install">
                Install the skill - free <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#self-host">
                Or run it yourself <span aria-hidden="true">↓</span>
              </a>
            </div>
          </section>
          <ShareStory />
        </section>
        <SceneTransition kind="view" />
        <section
          className="preview-scene example-scroll-scene"
          id="examples"
          aria-labelledby="examples-title"
        >
          <DocumentDemo />
        </section>
        <SceneTransition kind="install" />
        <section
          className="journey-scene install-scene"
          data-scene
          id="install"
          aria-labelledby="install-title"
        >
          <div className="scene-layout install-layout">
            <div className="install-intro scene-copy">
              <h2 id="install-title">
                Why I built
                <br />
                HTMLinks.
              </h2>
              <p>
                Creating documents with AI coding agents is becoming common. But
                the files usually stay on your computer.
              </p>
              <p>
                I built HTMLinks to make sharing them simple. Install the skill,
                upload an HTML document, and get a link people can open in their
                browser.
              </p>
              <p>
                Update it later and keep the same link. Add a password when
                needed.
              </p>
              <p className="hosting-note">
                Free managed hosting. <br />
                No account needed.
              </p>
            </div>
            <div className="scene-visual">
              <InstallGuide />
            </div>
          </div>
        </section>
        <SceneTransition kind="host" />
        <section
          className="journey-scene hosting-scene"
          data-scene
          id="self-host"
          aria-labelledby="self-host-title"
        >
          <div className="scene-layout hosting-layout">
            <div className="hosting-copy">
              <div className="scene-copy">
                <h2 id="self-host-title">Self-host HTMLinks.</h2>
                <p>
                  Open source. Docker Compose + PostgreSQL. The same skill, on
                  your infrastructure.
                </p>
              </div>
              <div className="scene-visual">
                <svg
                  className="server-sketch"
                  viewBox="0 0 92 90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M19 15 69 5 83 14V70L33 83 19 72Z"
                    fill="var(--wash)"
                  />
                  <path d="m19 15 14 9 50-10M33 24V83M19 33l14 9 50-11M19 52l14 9 50-12M24 24l5 3m-5 16 5 3m-5 16 5 3M44 31l25-7M44 50l25-7M44 69l25-7" />
                  <path
                    d="m74 25 3-1m-3 20 3-1m-3 20 3-1"
                    stroke="var(--accent)"
                    strokeWidth="3"
                  />
                  <path d="M9 78 26 88M64 84l22-6" />
                </svg>
              </div>
            </div>
            <div className="hosting-commands scene-visual">
              <a
                className="text-link github-link"
                href="https://github.com/michael-elkabetz/HTMLinks"
                target="_blank"
                rel="noreferrer"
              >
                Source on GitHub ↗
              </a>
              <div className="code-panel">
                <CopyButton text={selfHostCommand} />
                <pre>
                  <code>{selfHostCommand}</code>
                </pre>
              </div>
              <p className="self-host-skill">
                When the skill asks where to upload, choose self-hosted and give
                it your server URL. It remembers it for next time.
              </p>
              <Link className="text-link" href="/docs/self-hosting">
                Self-hosting guide
              </Link>
            </div>
          </div>
        </section>
        <ProductDetails />
      </LandingJourney>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(siteEntities()) }}
      />
      <footer className="site-footer">
        <Brand />
        <nav aria-label="Footer navigation">
          <Link href="/docs">Docs</Link>
          <Link href="/docs#api">API</Link>
          <Link href="/about">About</Link>
          <a
            href="https://github.com/michael-elkabetz/HTMLinks"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
        <span className="footer-credit">
          © {new Date().getFullYear()} · Built with ❤️ by{" "}
          <a href="https://mike.org.il" target="_blank" rel="noreferrer">
            Mike
          </a>
        </span>
      </footer>
    </>
  );
}
