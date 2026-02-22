#!/usr/bin/env node
/**
 * scripts/dev-urls.mjs
 *
 * Updates all dev service URLs when your free ngrok URL changes.
 * Run:  npm run dev:urls
 *
 * Auto-updates:
 *   ✅ .env  (BETTER_AUTH_BASE_URL, NEXT_PUBLIC_APP_URL)
 *   ✅ Stripe webhook endpoint URL (via Stripe API)
 *
 * Prints copy-paste checklist for:
 *   🔴 Google OAuth redirect URIs
 *   🔵 Slack event / interactivity / OAuth redirect URLs
 *   🟣 Microsoft OAuth redirect URIs  (if MICROSOFT_CLIENT_ID is set)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "..", ".env");

// Stripe events the Better Auth plugin needs
const STRIPE_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
];

// ── .env helpers ──────────────────────────────────────────────────────────────

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`.env not found at ${ENV_PATH}`);
  }
  return fs.readFileSync(ENV_PATH, "utf8");
}

function getEnvValue(content, key) {
  // Handles: KEY="value"  KEY='value'  KEY=value
  const m = content.match(new RegExp(`^${key}=["']?([^"'\n]+)["']?`, "m"));
  return m ? m[1].trim() : null;
}

function setEnvValue(content, key, value) {
  // Replace quoted value:   KEY="old"  →  KEY="new"
  const quotedRe = new RegExp(`^(${key}=["'])([^"'\n]*)(["'])`, "m");
  // Replace unquoted value: KEY=old    →  KEY=old
  const unquotedRe = new RegExp(`^(${key}=)(.*)$`, "m");

  if (quotedRe.test(content)) return content.replace(quotedRe, `$1${value}$3`);
  if (unquotedRe.test(content)) return content.replace(unquotedRe, `$1${value}`);

  // Key not present — append it
  return content.trimEnd() + `\n${key}="${value}"\n`;
}

// ── ngrok ─────────────────────────────────────────────────────────────────────

async function getNgrokUrl() {
  let res;
  try {
    res = await fetch("http://localhost:4040/api/tunnels");
  } catch {
    throw new Error(
      "Could not reach the ngrok local API at localhost:4040.\n" +
      "   Make sure ngrok is running:  ngrok http 3000"
    );
  }

  const data = await res.json();
  const tunnel = data.tunnels?.find((t) => t.proto === "https");

  if (!tunnel) {
    throw new Error(
      "ngrok is running but no HTTPS tunnel was found.\n" +
      "   Check:  ngrok http 3000"
    );
  }

  return tunnel.public_url; // e.g. "https://abc123.ngrok-free.app"
}

// ── Stripe ────────────────────────────────────────────────────────────────────

async function updateStripeWebhook(stripeKey, newBaseUrl) {
  const stripe = new Stripe(stripeKey);

  // List all webhook endpoints (max 20 is plenty for a dev account)
  const { data: endpoints } = await stripe.webhookEndpoints.list({ limit: 20 });

  // Find a dev endpoint — one whose URL looks like ngrok or localhost
  const devEndpoint = endpoints.find(
    (ep) => ep.url.includes("ngrok") || ep.url.includes("localhost") || ep.url.includes("127.0.0.1")
  );

  if (devEndpoint) {
    const existingPath = new URL(devEndpoint.url).pathname;
    const updatedUrl = `${newBaseUrl}${existingPath}`;

    if (devEndpoint.url === updatedUrl) {
      console.log(`   ✅ Already pointing to correct URL → ${updatedUrl}`);
      return null;
    }

    // Graft the new base URL onto the existing endpoint path so we don't
    // need to hard-code what path Better Auth uses for Stripe webhooks.
    await stripe.webhookEndpoints.update(devEndpoint.id, { url: updatedUrl });
    console.log(`   ✅ Updated → ${updatedUrl}`);
    console.log(`   ℹ️  Was:  ${devEndpoint.url}`);
    console.log("   ℹ️  Webhook secret unchanged (reuse existing STRIPE_WEBHOOK_SECRET)");
    return null; // secret doesn't change on update
  }

  // No dev endpoint found — create one.
  // Better Auth's Stripe plugin handles webhooks at the catch-all auth route.
  const webhookUrl = `${newBaseUrl}/api/auth`;
  const created = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: STRIPE_EVENTS,
    description: "ArcLogs dev webhook (auto-created by dev-urls script)",
  });

  console.log(`   ✅ Created → ${webhookUrl}`);
  return created.secret; // new secret — must be saved to .env
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const hr = "─".repeat(58);

  console.log(`\n${hr}`);
  console.log("  ArcLogs dev URL updater");
  console.log(`${hr}\n`);

  // 1. Detect ngrok URL
  process.stdout.write("🔍 Detecting ngrok URL... ");
  let ngrokUrl;
  try {
    ngrokUrl = await getNgrokUrl();
    console.log(`\n   ${ngrokUrl}\n`);
  } catch (err) {
    console.error(`\n\n❌ ${err.message}\n`);
    process.exit(1);
  }

  // 2. Read .env
  let env = readEnv();
  const oldUrl = getEnvValue(env, "NEXT_PUBLIC_APP_URL") || "(not set)";
  const envChanged = oldUrl !== ngrokUrl;

  if (envChanged) {
    console.log(`   Old URL: ${oldUrl}`);
    console.log(`   New URL: ${ngrokUrl}\n`);

    // 3. Update .env
    env = setEnvValue(env, "BETTER_AUTH_BASE_URL", ngrokUrl);
    env = setEnvValue(env, "NEXT_PUBLIC_APP_URL", ngrokUrl);
    fs.writeFileSync(ENV_PATH, env);
    console.log("✅ .env updated:");
    console.log("   BETTER_AUTH_BASE_URL");
    console.log("   NEXT_PUBLIC_APP_URL\n");
  } else {
    console.log(`   URL unchanged: ${ngrokUrl}\n`);
    console.log("✅ .env already up to date — checking Stripe anyway...\n");
  }

  // 4. Update Stripe webhook
  const stripeKey = getEnvValue(env, "STRIPE_SECRET_KEY");
  if (stripeKey) {
    console.log("🔄 Updating Stripe webhook endpoint...");
    try {
      const newSecret = await updateStripeWebhook(stripeKey, ngrokUrl);
      if (newSecret) {
        env = setEnvValue(env, "STRIPE_WEBHOOK_SECRET", newSecret);
        fs.writeFileSync(ENV_PATH, env);
        console.log("   ✅ .env updated: STRIPE_WEBHOOK_SECRET");
      }
    } catch (err) {
      console.warn(`   ⚠️  Stripe update failed: ${err.message}`);
      console.warn("       Update the webhook URL manually in the Stripe dashboard.\n");
    }
    console.log();
  } else {
    console.warn("⚠️  STRIPE_SECRET_KEY not found in .env — skipping Stripe.\n");
  }

  // 5. Manual steps checklist
  const hasMicrosoft = !!getEnvValue(env, "MICROSOFT_CLIENT_ID");

  console.log(hr);
  console.log("📋 MANUAL UPDATES REQUIRED");
  console.log(hr);

  console.log(`
🔴 Google OAuth Console
   https://console.cloud.google.com → APIs & Services → Credentials
   Select your OAuth 2.0 client → Authorized redirect URIs → add:

   ${ngrokUrl}/api/auth/callback/google

   (You can keep old URIs — Google allows multiple)

🔵 Slack App Console
   https://api.slack.com/apps → select your app

   Event Subscriptions → Request URL:
   ${ngrokUrl}/api/slack/events

   Interactivity & Shortcuts → Request URL:
   ${ngrokUrl}/api/slack/interactions

   OAuth & Permissions → Redirect URLs → add:
   ${ngrokUrl}/api/slack/oauth`);

  if (hasMicrosoft) {
    console.log(`
🟣 Microsoft Azure App
   https://portal.azure.com → Azure AD → App registrations → Authentication
   Redirect URIs → add:
   ${ngrokUrl}/api/auth/callback/microsoft`);
  }

  console.log(`
💡 Restart your Next.js dev server to pick up the .env changes:
   Ctrl+C  →  npm run dev
`);
  console.log(hr + "\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
