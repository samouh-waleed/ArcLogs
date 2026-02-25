// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://44b89465bcd829f8d1cc5b2851729df7@o4510945675706368.ingest.us.sentry.io/4510945677213696",

  // Sample 10% of traces in production to stay within free tier limits
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Don't send PII (emails, IPs) to Sentry in production
  sendDefaultPii: false,
});
