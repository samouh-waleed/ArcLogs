import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Allow cross-origin requests from the ngrok dev tunnel so that
// /_next/* HMR and static asset requests work without warnings.
// The hostname is read from .env at startup, so running `npm run dev:urls`
// followed by restarting the dev server is all that's needed when ngrok changes.
const devOrigins: string[] = [];

if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const { hostname } = new URL(process.env.NEXT_PUBLIC_APP_URL);
    if (hostname) devOrigins.push(hostname);
  } catch {
    // malformed URL — skip
  }
}

const nextConfig: NextConfig = {
  ...(devOrigins.length > 0 && { allowedDevOrigins: devOrigins }),
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "arclogs",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
