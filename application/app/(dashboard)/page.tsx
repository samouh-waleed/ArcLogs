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
  Crown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slackWorkspace, setSlackWorkspace] = useState<any>(null);
  const [loadingSlack, setLoadingSlack] = useState(true);
  const [jiraConnected, setJiraConnected] = useState(false);
  const [loadingJira, setLoadingJira] = useState(true);
  const [teamsCount, setTeamsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [standupsCount, setStandupsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [usage, setUsage] = useState<any>(null);

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

  // Load Jira connection status
  useEffect(() => {
    async function loadJiraConnection() {
      if (!activeOrg?.id) return;

      try {
        const response = await fetch(`/api/jira/connection?orgId=${activeOrg.id}`);
        if (response.ok) {
          const data = await response.json();
          setJiraConnected(!!data.connection);
        }
      } catch (error) {
        console.error("Failed to load Jira connection:", error);
      } finally {
        setLoadingJira(false);
      }
    }

    loadJiraConnection();
  }, [activeOrg?.id]);

  // Load plan + usage limits
  useEffect(() => {
    if (!activeOrg?.id) return;
    fetch(`/api/organization-usage?orgId=${activeOrg.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUsage(data); })
      .catch(() => {});
  }, [activeOrg?.id]);

  // Load dashboard statistics
  useEffect(() => {
    async function loadStats() {
      if (!activeOrg?.id) return;

      try {
        // Load teams count
        const teamsResponse = await fetch(`/api/teams?orgId=${activeOrg.id}`);
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeamsCount(teamsData.teams?.length || 0);

          // If there are teams, count members and standups
          if (teamsData.teams?.length > 0) {
            let totalMembers = 0;
            let totalStandups = 0;

            for (const team of teamsData.teams) {
              // Count members
              const membersResponse = await fetch(
                `/api/teams/${team.id}/members`
              );
              if (membersResponse.ok) {
                const membersData = await membersResponse.json();
                totalMembers += membersData.members?.length || 0;
              }

              // Count standups
              const standupsResponse = await fetch(
                `/api/standups?teamId=${team.id}`
              );
              if (standupsResponse.ok) {
                const standupsData = await standupsResponse.json();
                totalStandups += standupsData.standups?.length || 0;
              }
            }

            setMembersCount(totalMembers);
            setStandupsCount(totalStandups);
          }
        }
      } catch (error) {
        console.error("Failed to load statistics:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
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

  // Redirect to create organization if needed
  useEffect(() => {
    if (!isLoadingSession && !isLoadingOrg && (!session || !activeOrg)) {
      router.push("/create-organization");
    }
  }, [isLoadingSession, isLoadingOrg, session, activeOrg, router]);

  if (isLoadingSession || isLoadingOrg) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!session || !activeOrg) {
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

      {/* Plan status banner — free plan only */}
      {usage && usage.plan === "free" && (() => {
        const atLimit =
          usage.teams.percentage >= 100 ||
          usage.members.percentage >= 100 ||
          usage.standups.percentage >= 100;
        return (
          <Card
            className={
              atLimit
                ? "border-amber-300 bg-amber-50"
                : "border-blue-200 bg-blue-50"
            }
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    {atLimit ? (
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    ) : (
                      <Crown className="h-4 w-4 shrink-0 text-blue-600" />
                    )}
                    <p
                      className={`font-medium text-sm ${
                        atLimit ? "text-amber-900" : "text-blue-900"
                      }`}
                    >
                      {atLimit
                        ? "You've reached your Free plan limits"
                        : "You're on the Free plan"}
                    </p>
                  </div>
                  <p
                    className={`text-xs ${
                      atLimit ? "text-amber-700" : "text-blue-700"
                    }`}
                  >
                    {atLimit
                      ? "Upgrade to Pro for unlimited teams, 50 members, voice standups, and Jira automation."
                      : "Voice standups and Jira automation are locked. Upgrade to Pro to unlock all features."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Teams", ...usage.teams },
                      { label: "Members", ...usage.members },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          item.percentage >= 100
                            ? "bg-red-100 border-red-300 text-red-700"
                            : item.percentage >= 80
                            ? "bg-amber-100 border-amber-300 text-amber-700"
                            : "bg-white/70 border-gray-200 text-gray-600"
                        }`}
                      >
                        {item.label}: {item.current}/{item.limit}
                      </span>
                    ))}
                  </div>
                </div>
                <Button size="sm" asChild className="shrink-0">
                  <Link href="/billing">
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Onboarding Checklist */}
      {activeOrg && !loadingSlack && !loadingJira && !loadingStats && (
        <OnboardingChecklist
          slackConnected={!!slackWorkspace}
          jiraConnected={jiraConnected}
          hasTeams={teamsCount > 0}
          hasMembers={membersCount > 0}
          hasStandups={standupsCount > 0}
          organizationId={activeOrg.id}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{teamsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {teamsCount === 0
                    ? "No teams created yet"
                    : `${teamsCount} team${teamsCount === 1 ? "" : "s"}`}
                </p>
                {usage?.plan === "free" && (
                  <div className="mt-2 space-y-1">
                    <Progress value={usage.teams.percentage} className="h-1" />
                    <p
                      className={`text-xs ${
                        usage.teams.percentage >= 100
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {usage.teams.current} / {usage.teams.limit} used
                      {usage.teams.percentage >= 100 && " · Limit reached"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{membersCount}</div>
                <p className="text-xs text-muted-foreground">
                  {membersCount === 0 ? "No members yet" : "Across all teams"}
                </p>
                {usage?.plan === "free" && (
                  <div className="mt-2 space-y-1">
                    <Progress value={usage.members.percentage} className="h-1" />
                    <p
                      className={`text-xs ${
                        usage.members.percentage >= 100
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {usage.members.current} / {usage.members.limit} used
                      {usage.members.percentage >= 100 && " · Limit reached"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standups</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{standupsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {standupsCount === 0
                    ? "No standups configured"
                    : `Active configuration${standupsCount === 1 ? "" : "s"}`}
                </p>
                {usage?.plan === "free" && (
                  <div className="mt-2 space-y-1">
                    <Progress
                      value={usage.standups.percentage}
                      className="h-1"
                    />
                    <p
                      className={`text-xs ${
                        usage.standups.percentage >= 100
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {usage.standups.current} / {usage.standups.limit} used
                      {usage.standups.percentage >= 100 && " · Limit reached"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
