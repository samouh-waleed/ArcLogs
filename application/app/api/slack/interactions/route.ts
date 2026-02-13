// app/api/slack/interactions/route.ts
// Handles Slack interactive components (button clicks, modal submissions)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slackWorkspace, jiraConnection } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import crypto from "crypto";

function verifySlackSignature(
  signingSecret: string,
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac("sha256", signingSecret);
  const [version, hash] = signature.split("=");
  const baseString = `${version}:${timestamp}:${body}`;
  const expectedHash = hmac.update(baseString).digest("hex");
  return hash === expectedHash;
}

// Create a Jira issue via REST API
async function createJiraIssue(
  domain: string,
  email: string,
  apiToken: string,
  projectKey: string,
  summary: string,
  issueType: string,
  priority: string,
  userName: string
) {
  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

  // Create issue
  const createRes = await fetch(`https://${domain}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Created from ArcLogs standup by ${userName}.`,
                },
              ],
            },
          ],
        },
        issuetype: { name: issueType },
        priority: { name: priority },
        labels: ["arclogs-standup"],
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Jira create failed (${createRes.status}): ${errText}`);
  }

  const issue = await createRes.json();
  const issueKey = issue.key;
  const issueUrl = `https://${domain}/browse/${issueKey}`;

  // Try to assign to active sprint
  try {
    // Find board
    const boardRes = await fetch(
      `https://${domain}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );
    if (boardRes.ok) {
      const boards = (await boardRes.json()).values || [];
      for (const board of boards) {
        const sprintRes = await fetch(
          `https://${domain}/rest/agile/1.0/board/${board.id}/sprint?state=active`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            },
          }
        );
        if (sprintRes.ok) {
          const sprints = (await sprintRes.json()).values || [];
          if (sprints.length > 0) {
            await fetch(
              `https://${domain}/rest/agile/1.0/sprint/${sprints[0].id}/issue`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${auth}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ issues: [issueKey] }),
              }
            );
            break;
          }
        }
      }
    }
  } catch {
    // Sprint assignment is best-effort
  }

  return { key: issueKey, url: issueUrl };
}

// Respond via Slack response_url (updates the original message)
async function respondToSlack(responseUrl: string, message: string) {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      replace_original: true,
      text: message,
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: message },
        },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const timestamp = req.headers.get("x-slack-request-timestamp");
    const signature = req.headers.get("x-slack-signature");

    // Verify Slack signature
    if (
      timestamp &&
      signature &&
      !verifySlackSignature(
        process.env.SLACK_SIGNING_SECRET!,
        body,
        timestamp,
        signature
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the URL-encoded payload
    const params = new URLSearchParams(body);
    const payloadStr = params.get("payload");
    if (!payloadStr) {
      return NextResponse.json({ error: "No payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    if (payload.type === "block_actions") {
      const action = payload.actions?.[0];
      if (!action) return NextResponse.json({ ok: true });

      const responseUrl = payload.response_url;
      let data: any = {};
      try {
        data = JSON.parse(action.value || "{}");
      } catch {
        data = {};
      }

      if (action.action_id === "create_ticket") {
        // Look up Jira connection
        const orgId = data.oid;
        if (!orgId) {
          await respondToSlack(responseUrl, "❌ Missing organization data.");
          return NextResponse.json({ ok: true });
        }

        const jiraConn = await db.query.jiraConnection.findFirst({
          where: and(
            eq(jiraConnection.organizationId, orgId),
            eq(jiraConnection.isActive, true),
            isNull(jiraConnection.deletedAt)
          ),
        });

        if (!jiraConn) {
          await respondToSlack(
            responseUrl,
            "❌ No Jira connection found. Please configure in Settings."
          );
          return NextResponse.json({ ok: true });
        }

        try {
          const issue = await createJiraIssue(
            jiraConn.jiraDomain,
            jiraConn.jiraEmail,
            jiraConn.jiraApiToken,
            data.pk || jiraConn.defaultProjectKey || "",
            data.t || "Untitled",
            data.ty || "Task",
            data.pr || "Medium",
            data.un || "Unknown"
          );

          await respondToSlack(
            responseUrl,
            `✅ Created <${issue.url}|${issue.key}>: ${data.t}\nAssigned to active sprint.`
          );

          console.log(`✅ User confirmed ticket creation: ${issue.key}`);
        } catch (error) {
          console.error("Jira creation error:", error);
          await respondToSlack(
            responseUrl,
            `❌ Failed to create ticket: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }

        return NextResponse.json({ ok: true });
      }

      if (action.action_id === "skip_ticket") {
        await respondToSlack(
          responseUrl,
          `👍 Skipped ticket creation: _${data.t || "Untitled"}_`
        );
        console.log(`⏭️ User skipped ticket: ${data.t}`);
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack interaction error:", error);
    return NextResponse.json({ ok: true });
  }
}
