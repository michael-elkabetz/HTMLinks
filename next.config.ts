import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  turbopack: { root: process.cwd() },
  devIndicators: false,
  outputFileTracingExcludes: {
    "/*": ["./data/**/*", "./.env*", "./tests/**/*", "./docs/**/*"],
  },
  serverExternalPackages: ["@node-rs/argon2", "postgres"],
  experimental: { proxyClientMaxBodySize: "12mb" },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
