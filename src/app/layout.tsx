import type { Metadata } from "next";
import { indexPublicSite, siteOrigin } from "@/lib/seo";
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-500.css";
import "./globals.css";
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteOrigin()),
    title: { default: "HTMLinks", template: "%s | HTMLinks" },
    robots: indexPublicSite()
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
