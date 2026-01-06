// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertCircle,
  Slack,
  Users,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slackWorkspace, setSlackWorkspace] = useState<any>(null);
  const [loadingSlack, setLoadingSlack] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: session, isPending: isLoadingSession } =
    authClient.useSession();
  const { data: activeOrg, isPending: isLoadingOrg } =
    authClient.useActiveOrganization();

  // Check for success/error messages from URL
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "slack_connected") {
      setMessage({ type: "success", text: "Slack connected successfully!" });
      router.replace("/");
    } else if (error) {
      setMessage({
        type: "error",
        text: `Error: ${error.replace(/_/g, " ")}`,
      });
      router.replace("/");
    }

    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  // Load Slack workspace
  useEffect(() => {
    async function loadSlackWorkspace() {
      if (!activeOrg?.id) return;

      try {
        const response = await fetch(
          `/api/slack/workspace?orgId=${activeOrg.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setSlackWorkspace(data.workspace);
        }
      } catch (error) {
        console.error("Failed to load Slack workspace:", error);
      } finally {
        setLoadingSlack(false);
      }
    }

    loadSlackWorkspace();
  }, [activeOrg?.id]);

  const handleConnectSlack = () => {
    if (!activeOrg?.id) return;

    // Redirect to Slack OAuth
    const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackAuthUrl.searchParams.set(
      "client_id",
      process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!
    );
    slackAuthUrl.searchParams.set(
      "scope",
      "channels:read,chat:write,im:write,users:read,users:read.email"
    );
    slackAuthUrl.searchParams.set(
      "redirect_uri",
      `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth`
    );
    slackAuthUrl.searchParams.set("state", activeOrg.id);

    window.location.href = slackAuthUrl.toString();
  };

  if (isLoadingSession || isLoadingOrg) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!session || !activeOrg) {
    router.push("/create-organization");
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}!
        </p>
      </div>

      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className={
            message.type === "success"
              ? "bg-green-50 border-green-200"
              : undefined
          }
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription
            className={
              message.type === "success" ? "text-green-800" : undefined
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Slack className="h-5 w-5" />
            Slack Integration
          </CardTitle>
          <CardDescription>
            Connect your Slack workspace to enable async standups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSlack ? (
            <Skeleton className="h-20" />
          ) : slackWorkspace ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {slackWorkspace.slackTeamName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Connected on{" "}
                      {new Date(
                        slackWorkspace.installedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectSlack}
                >
                  Reconnect
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create a team and add members</li>
                  <li>Configure standup questions</li>
                  <li>
                    Your team will start receiving standup requests in Slack!
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Slack workspace to get started with async standups.
                The ArcLogs bot will send daily standup questions to your team
                members via DM.
              </p>
              <Button onClick={handleConnectSlack} className="w-full">
                <Slack className="mr-2 h-4 w-4" />
                Connect Slack Workspace
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No teams created yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active insights</p>
          </CardContent>
        </Card>
      </div>

      {!slackWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to set up ArcLogs for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Connect Slack</h4>
                  <p className="text-sm text-muted-foreground">
                    Install the ArcLogs bot in your Slack workspace
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold text-muted-foreground">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">
                    Create Teams
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Organize your organization into teams
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold text-muted-foreground">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">
                    Configure Standups
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Set up questions and schedule for each team
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
