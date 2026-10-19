import type { MetadataRoute } from "next";
import { indexPublicSite, siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return indexPublicSite()
    ? {
        rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
        sitemap: `${siteOrigin()}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
