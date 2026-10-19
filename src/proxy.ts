import { NextResponse, type NextRequest } from "next/server";
import { publicIndexingAllowed } from "./lib/seo-policy";
export function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;
  const appOrigin = new URL(process.env.APP_URL || "http://localhost:3000");
  const host = request.headers.get("host");
  if (host !== appOrigin.host && p !== "/api/health")
    return new NextResponse("Unknown host", { status: 421 });
  if (p === "/app" || p.startsWith("/app/") || p === "/login")
    return NextResponse.redirect(new URL("/#install", appOrigin));
  if (p.startsWith("/d/")) {
    const canonical = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      appOrigin,
    );
    canonical.pathname = p.replace(/^\/d\//, "/rendered/");
    return NextResponse.redirect(canonical, 308);
  }
  const response = NextResponse.next();
  if (
    !publicIndexingAllowed(appOrigin.origin, process.env.INDEX_PUBLIC_SITE) ||
    p.startsWith("/api/") ||
    p.startsWith("/rendered/") ||
    p.startsWith("/skill/") ||
    p === "/install"
  )
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (p.startsWith("/api/") || p.startsWith("/rendered/"))
    response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
