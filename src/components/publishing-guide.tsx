import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "./brand";
import { guides } from "@/lib/guides";
import { pageMetadata, siteOrigin } from "@/lib/seo";
import { jsonLd } from "@/lib/seo-policy";

export function guideMetadata(path: string) {
  const guide = guides(siteOrigin()).find((entry) => entry.path === path);
  if (!guide) notFound();
  return pageMetadata(path, guide.title, guide.description);
}

export function PublishingGuide({ path }: { path: string }) {
  const origin = siteOrigin();
  const entries = guides(origin);
  const guide = entries.find((entry) => entry.path === path);
  if (!guide) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${origin}${path}#page`,
        url: `${origin}${path}`,
        name: guide.title,
        description: guide.description,
        author: {
          "@type": "Person",
          name: "Michael Elkabetz",
          url: "https://mike.org.il",
        },
        isPartOf: { "@id": `${origin}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "HTMLinks", item: origin },
          {
            "@type": "ListItem",
            position: 2,
            name: "Documentation",
            item: `${origin}/docs`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: guide.title,
            item: `${origin}${path}`,
          },
        ],
      },
    ],
  };
  return (
    <>
      <SiteHeader />
      <main id="main" className="docs-layout">
        <nav className="docs-nav" aria-label="On this page">
          <Link href="/docs">← All documentation</Link>
          {guide.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
        <article className="docs-content">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link href="/docs">Docs</Link>
          </nav>
          <h1>{guide.title}</h1>
          <p>{guide.description}</p>
          <p className="guide-credit">
            By <a href="https://mike.org.il">Michael Elkabetz</a> · HTMLinks
            maintainer
          </p>
          {guide.sections.map((section) => (
            <section id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.content}
            </section>
          ))}
          <section aria-labelledby="related-title">
            <h2 id="related-title">Continue publishing</h2>
            <ul>
              {entries
                .filter((entry) => entry.path !== path)
                .map((entry) => (
                  <li key={entry.path}>
                    <Link href={entry.path}>{entry.title}</Link>
                  </li>
                ))}
            </ul>
            <Link className="button" href="/#install">
              Install the skill
            </Link>
          </section>
        </article>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
    </>
  );
}
