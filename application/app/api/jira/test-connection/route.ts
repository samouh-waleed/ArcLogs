// app/api/jira/test-connection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canUseJira } from "@/lib/limits";

export async function POST(req: NextRequest) {
  console.log("[Jira Test] Starting test connection");

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.error("[Jira Test] No session found");
      return NextResponse.json({
        success: false,
        error: "Unauthorized - please log in"
      }, { status: 401 });
    }

    console.log("[Jira Test] Session valid for user:", session.user.id);

    const body = await req.json();
    const { jiraDomain, jiraEmail, jiraApiToken, organizationId } = body;

    console.log("[Jira Test] Request body:", {
      jiraDomain,
      jiraEmail: jiraEmail ? "***provided***" : "missing",
      jiraApiToken: jiraApiToken ? "***provided***" : "missing",
      organizationId: organizationId || "missing",
    });

    if (!jiraDomain || !jiraEmail || !jiraApiToken) {
      console.error("[Jira Test] Missing required fields");
      return NextResponse.json(
        {
          success: false,
          error: "Jira domain, email, and API token are required"
        },
        { status: 400 }
      );
    }

    // Plan gate: Jira integration is Pro+ only
    if (organizationId) {
      const jiraAllowed = await canUseJira(organizationId);
      if (!jiraAllowed) {
        return NextResponse.json(
          { success: false, error: "Jira integration requires a Pro plan.", upgradeRequired: true },
          { status: 403 }
        );
      }
    }

    // Clean domain
    const cleanDomain = jiraDomain.replace(/^https?:\/\//, "");
    console.log("[Jira Test] Cleaned domain:", cleanDomain);

    // Test connection by calling Jira API /myself endpoint
    const authString = `${jiraEmail}:${jiraApiToken}`;
    const authBase64 = Buffer.from(authString).toString("base64");

    console.log("[Jira Test] Calling Jira API:", `https://${cleanDomain}/rest/api/3/myself`);

    const response = await fetch(
      `https://${cleanDomain}/rest/api/3/myself`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${authBase64}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[Jira Test] Jira API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[Jira Test] Failed: ${response.status} ${response.statusText}`);
      console.error(`[Jira Test] Error body:`, errorData.substring(0, 500));
      return NextResponse.json(
        {
          success: false,
          error: `Jira API returned ${response.status}: ${response.statusText}`,
          details: errorData.substring(0, 500),
        },
        { status: 200 }
      );
    }

    const userData = await response.json();
    console.log("[Jira Test] Success! Authenticated as:", userData.displayName);

    return NextResponse.json({
      success: true,
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId,
      },
    });
  } catch (error) {
    console.error("[Jira Test] Exception occurred:", error);

    // Extract detailed error information
    let errorMessage = "Unknown error";
    let errorStack = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || "";
      console.error("[Jira Test] Error stack:", errorStack);
    } else {
      errorMessage = String(error);
    }

    // Check for common errors
    if (errorMessage.includes("fetch")) {
      errorMessage = "Failed to connect to Jira API. Please check your domain and network connection.";
    } else if (errorMessage.includes("timeout")) {
      errorMessage = "Connection timeout. Please check your Jira domain and try again.";
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorStack ? errorStack.split("\n")[0] : errorMessage,
      },
      { status: 200 }
    );
  }
}
