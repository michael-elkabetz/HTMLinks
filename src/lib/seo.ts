import "server-only";
import type { Metadata } from "next";
import { config } from "./config";
import { publicIndexingAllowed } from "./seo-policy";

export const repositoryUrl = "https://github.com/michael-elkabetz/HTMLinks";
export const siteDescription =
  "Publish HTML files from Claude Code or Codex. Share one lasting link, update it, add a password, or self-host HTMLinks. No account needed to upload.";

export function siteOrigin() {
  return config().app;
}

export function indexPublicSite() {
  return publicIndexingAllowed(siteOrigin(), process.env.INDEX_PUBLIC_SITE);
}

export function pageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const url = new URL(path, siteOrigin()).href;
  const fullTitle = `${title} | HTMLinks`;
  const images = [
    {
      url: new URL("/opengraph-image", siteOrigin()).href,
      width: 1200,
      height: 630,
      alt: "HTMLinks — HTML publishing for AI coding agents",
    },
  ];
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "HTMLinks",
      title: fullTitle,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images,
    },
  };
}

export function siteEntities() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${origin}/#page`,
        name: "HTML Publishing for AI Coding Agents | HTMLinks",
        url: origin,
        description: siteDescription,
        isPartOf: { "@id": `${origin}/#website` },
        mainEntity: { "@id": `${origin}/#software` },
      },
      {
        "@type": "Person",
        "@id": `${origin}/#maintainer`,
        name: "Michael Elkabetz",
        url: "https://mike.org.il",
        sameAs: ["https://github.com/michael-elkabetz"],
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "HTMLinks",
        url: origin,
        publisher: { "@id": `${origin}/#maintainer` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#software`,
        name: "HTMLinks",
        url: origin,
        description: siteDescription,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web; Node.js 22.22+ for the publishing CLI",
        license: `${repositoryUrl}/blob/main/LICENSE`,
        author: { "@id": `${origin}/#maintainer` },
        subjectOf: { "@id": `${origin}/#source` },
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${origin}/#source`,
        name: "HTMLinks source code",
        codeRepository: repositoryUrl,
        programmingLanguage: "TypeScript",
        license: `${repositoryUrl}/blob/main/LICENSE`,
        author: { "@id": `${origin}/#maintainer` },
      },
    ],
  };
}

export function webPageSchema(
  path: string,
  name: string,
  description: string,
  type = "WebPage",
) {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${origin}${path}#page`,
    url: `${origin}${path}`,
    name,
    description,
    isPartOf: { "@id": `${origin}/#website` },
  };
}
