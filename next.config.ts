import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * AppShell injects the xterm stylesheet from jsDelivr at runtime
 * (src/components/AppShell.tsx), so that origin is required in style-src.
 *
 * 'unsafe-inline' is required for style-src: Cloudscape applies inline styles
 * extensively and several auth pages ship inline <style> blocks.
 *
 * 'unsafe-eval' is limited to development — it is required by the dev server
 * and must not ship to production.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // All browser-side requests target same-origin /api routes.
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  transpilePackages: [
    "@cloudscape-design/components",
    "@cloudscape-design/component-toolkit",
    "@cloudscape-design/collection-hooks",
    "@cloudscape-design/code-view",
  ],
  serverExternalPackages: ["@aws-sdk/client-*"],
  output: "standalone",
  compress: true,

  // Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  experimental: {
    // Turbopack chunking for optimal bundle splitting
    turbopackChunking: {
      minChunkSize: 50000,
      maxChunkCountPerGroup: 40,
      maxMergeChunkSize: 200000,
      generateComponentChunks: true,
    },

    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      "@cloudscape-design/components",
      "@cloudscape-design/collection-hooks",
      "@cloudscape-design/code-view",
      "next/image",
      "next/link",
      "next/navigation",
    ],
  },

  // Webpack optimizations (for non-Turbopack builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split Cloudscape into separate chunk (shared across all pages)
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            cloudscape: {
              test: /[\\/]node_modules[\\/]@cloudscape-design[\\/]/,
              name: "cloudscape",
              chunks: "all",
              priority: 10,
            },
            commons: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 5,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
