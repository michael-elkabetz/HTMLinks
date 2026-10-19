import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";
import { indexPublicSite, siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexPublicSite()) return [];
  const origin = siteOrigin();
  return [
    "/",
    "/docs",
    "/about",
    ...guides(origin).map((guide) => guide.path),
  ].map((path) => ({
    url: path === "/" ? origin : new URL(path, origin).href,
  }));
}
