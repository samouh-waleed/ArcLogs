#!/usr/bin/env node
/**
 * scripts/encrypt-existing-tokens.mjs
 *
 * One-time migration: encrypts plaintext Slack bot tokens and Jira API tokens
 * that were stored before encryption was introduced.
 *
 * Run:  npm run db:encrypt-tokens
 *
 * Safe to run multiple times — already-encrypted values are detected and skipped.
 */

import { createCipheriv, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
try {
  const envFile = readFileSync(resolve(__dirname, "..", ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const rawVal = trimmed.slice(eqIdx + 1).trim();
    const val = rawVal.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  console.error("Could not load .env:", e.message);
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error("ENCRYPTION_KEY must be a 64-character hex string in .env");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const ENC_PATTERN = /^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/;

function encryptValue(plaintext) {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

function isEncrypted(value) {
  return Boolean(value && ENC_PATTERN.test(value));
}

async function main() {
  const sql = neon(DATABASE_URL);

  console.log("ArcLogs token encryption migration\n");

  // ── Slack bot tokens ──────────────────────────────────────────────────
  const slackRows = await sql`
    SELECT id, slack_team_name, bot_token
    FROM slack_workspace
    WHERE deleted_at IS NULL AND bot_token IS NOT NULL
  `;

  let slackEncrypted = 0;
  let slackSkipped = 0;

  for (const row of slackRows) {
    if (isEncrypted(row.bot_token)) {
      slackSkipped++;
      continue;
    }
    const enc = encryptValue(row.bot_token);
    await sql`
      UPDATE slack_workspace SET bot_token = ${enc} WHERE id = ${row.id}
    `;
    console.log(`  Slack workspace "${row.slack_team_name}" — token encrypted`);
    slackEncrypted++;
  }

  console.log(
    `\nSlack: ${slackEncrypted} encrypted, ${slackSkipped} already encrypted\n`
  );

  // ── Jira API tokens ───────────────────────────────────────────────────
  const jiraRows = await sql`
    SELECT id, jira_domain, jira_api_token
    FROM jira_connection
    WHERE deleted_at IS NULL AND is_active = TRUE AND jira_api_token IS NOT NULL
  `;

  let jiraEncrypted = 0;
  let jiraSkipped = 0;

  for (const row of jiraRows) {
    if (isEncrypted(row.jira_api_token)) {
      jiraSkipped++;
      continue;
    }
    const enc = encryptValue(row.jira_api_token);
    await sql`
      UPDATE jira_connection SET jira_api_token = ${enc} WHERE id = ${row.id}
    `;
    console.log(`  Jira connection "${row.jira_domain}" — token encrypted`);
    jiraEncrypted++;
  }

  console.log(
    `Jira: ${jiraEncrypted} encrypted, ${jiraSkipped} already encrypted\n`
  );
  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
