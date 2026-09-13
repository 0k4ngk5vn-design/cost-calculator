/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.1.202", "10.0.0.6"],
  reactStrictMode: false,
  output: "standalone",
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      ...["/", "/ingredients/:path*", "/menu/:path*"].map((source) => ({
        source,
        headers: securityHeaders,
      })),
      ...["ingredients", "menu", "category", "unit"].map((resource) => ({
        source: `/api/${resource}/:path*`,
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "private, no-store" },
        ],
      })),
    ];
  },
};

export default nextConfig;
