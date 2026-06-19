import type { NextConfig } from "next";
// @ts-expect-error — next-pwa has no types
import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com/,
      handler: "CacheFirst",
      options: { cacheName: "google-fonts", expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "static-images", expiration: { maxEntries: 64, maxAgeSeconds: 86400 } },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: { cacheName: "next-static", expiration: { maxAgeSeconds: 86400 * 30 } },
    },
  ],
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    formats: ["image/webp"],
  },
};

export default withSentryConfig(pwaConfig(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in CI/production to avoid slowing local builds
  silent: true,
  disableLogger: true,
});
