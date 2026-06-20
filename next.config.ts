import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
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
  },
});

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Disable the Next.js dev toolbar indicator bubble
  devIndicators: false,
};

export default withSentryConfig(withNextIntl(pwaConfig(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  disableLogger: true,
});
