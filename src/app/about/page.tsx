import Link from "next/link";
import { SiteHeader } from "@/components/brand";
import { pageMetadata, repositoryUrl, webPageSchema } from "@/lib/seo";
import { jsonLd } from "@/lib/seo-policy";

export const dynamic = "force-dynamic";
const title = "About HTMLinks";
const description =
  "Meet Michael Elkabetz, the maintainer of HTMLinks. Find the MIT-licensed source, support channels, and document access and retention information.";
export function generateMetadata() {
  return pageMetadata("/about", title, description);
}

export default function About() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            webPageSchema("/about", title, description, "AboutPage"),
          ),
        }}
      />
      <SiteHeader />
      <main id="main" className="reading-page docs-content">
        <h1>About HTMLinks.</h1>
        <p>
          HTMLinks is an open-source HTML publishing tool created and maintained
          by <a href="https://mike.org.il">Michael Elkabetz</a>. It helps people
          share the documents, reports, and presentations their coding agents
          create, then update them without changing the sharing URL.
        </p>
        <section>
          <h2>Open source, with a self-hosted option.</h2>
          <p>
            The <a href={repositoryUrl}>source code is on GitHub</a> under the{" "}
            <a href={`${repositoryUrl}/blob/main/LICENSE`}>MIT license</a>. Use
            the managed service or{" "}
            <Link href="/docs/self-hosting">run it on your infrastructure</Link>
            . Infrastructure costs and an operator’s service policies are
            separate from the source license.
          </p>
        </section>
        <section>
          <h2>Document access and retention.</h2>
          <p>
            Uploading requires no account. Authors manage their documents with
            private keys saved locally by the skill. Unlisted links can be read
            by anyone who has the URL. Passwords gate delivery; authorized
            readers can still save copies. Private previews require the
            document’s management key.
          </p>
          <p>
            Shared documents are marked noindex and excluded from the public
            sitemap. Those discovery signals are not access control. Choose
            password protection or private access when a link alone is
            insufficient.
          </p>
          <p>
            Authors can set expiry dates or delete documents. Deleted content
            can be restored during the operator-configured retention window,
            seven days by default. Availability depends on the hosting instance;
            no permanent-storage or uptime guarantee is stated here. Keep your
            original files and management-key backups.
          </p>
          <p>
            See <Link href="/docs#keys">management keys</Link> and{" "}
            <Link href="/guides/password-protected-html">
              password protection
            </Link>{" "}
            for the exact workflows.
          </p>
        </section>
        <section>
          <h2>Contact and project support.</h2>
          <p>
            Report bugs and request features through{" "}
            <a href={`${repositoryUrl}/issues`}>GitHub issues</a>. For security
            reports, follow the repository’s{" "}
            <a href={`${repositoryUrl}/blob/main/SECURITY.md`}>
              security reporting instructions
            </a>
            . Keep passwords, management keys, and confidential documents out of
            public issues.
          </p>
          <Link href="/docs">Read the documentation →</Link>
        </section>
      </main>
    </>
  );
}
