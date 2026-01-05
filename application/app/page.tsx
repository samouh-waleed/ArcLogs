"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Layers,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Calendar,
  MessageSquare,
  Activity,
  Plus,
  Crown,
  Hash,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

async function fetchTeams() {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Failed to fetch teams");
  return response.json();
}

async function fetchDashboardStats() {
  const response = await fetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

async function fetchRecentUpdates() {
  const response = await fetch("/api/updates/recent?limit=10");
  if (!response.ok) return [];
  return response.json();
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: isLoadingOrg } =
    authClient.useActiveOrganization();

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    enabled: !!activeOrg?.id,
  });

  // Fetch teams
  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  // Fetch recent updates
  const { data: recentUpdatesData, isLoading: isLoadingUpdates } = useQuery({
    queryKey: ["recent-updates"],
    queryFn: fetchRecentUpdates,
    enabled: !!activeOrg?.id,
  });

  // Ensure arrays
  const teams = Array.isArray(teamsData)
    ? teamsData
    : Array.isArray(teamsData?.teams)
    ? teamsData.teams
    : [];
  const recentUpdates = Array.isArray(recentUpdatesData)
    ? recentUpdatesData
    : [];

  // Filter teams user is a member of
  const myTeams = teams.filter((team: any) =>
    team.teamMembers?.some((tm: any) => tm.userId === session?.user?.id)
  );

  // Use stats from API or fallback to calculated
  const totalTeams = stats?.totalTeams ?? teams.length;
  const myTeamsCount = stats?.myTeamsCount ?? myTeams.length;
  const leaderTeamsCount = stats?.leaderTeamsCount ?? 0;
  const orgMembersCount = stats?.orgMembersCount ?? 0;
  const updatesToday = stats?.updatesToday ?? 0;
  const hasSubmittedToday = stats?.hasSubmittedToday ?? false;

  if (isLoadingOrg || isLoadingTeams || isLoadingStats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const hasTeams = teams.length > 0;
  const isMemberOfAnyTeam = myTeams.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0] || "there"}! 👋
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {hasSubmittedToday
            ? "Great job submitting your update today! 🎉"
            : "Here's what's happening with your teams today."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {myTeamsCount > 0 ? `You're in ${myTeamsCount}` : "No teams yet"}
            </p>
          </CardContent>
        </Card>

        {/* Organization Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Organization Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgMembersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeOrg?.name}
            </p>
          </CardContent>
        </Card>

        {/* Updates Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updatesToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasSubmittedToday
                ? "✓ You've submitted today"
                : updatesToday === 0
                ? "No updates yet"
                : "Across all teams"}
            </p>
          </CardContent>
        </Card>

        {/* Team Leader */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Leader</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderTeamsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {leaderTeamsCount === 0
                ? "No teams"
                : leaderTeamsCount === 1
                ? "1 team"
                : `${leaderTeamsCount} teams`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Takes 2 columns on large screens */}
        <div className="space-y-6 lg:col-span-2">
          {/* My Teams */}
          {isMemberOfAnyTeam ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Teams</CardTitle>
                    <CardDescription>
                      Quick access to your teams
                    </CardDescription>
                  </div>
                  <Link href="/teams">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myTeams.slice(0, 5).map((team: any) => {
                    const memberCount = team.teamMembers?.length || 0;
                    const member = team.teamMembers?.find(
                      (tm: any) => tm.userId === session?.user?.id
                    );
                    const isLeader = member?.role === "leader";

                    return (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/teams/${team.id}`)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                            <Hash className="h-5 w-5 text-white" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {team.name}
                              </p>
                              {isLeader && (
                                <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {memberCount}{" "}
                              {memberCount === 1 ? "member" : "members"}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/teams/${team.id}/submit`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">
                              Submit Update
                            </span>
                            <span className="sm:hidden">Submit</span>
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                {myTeams.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/teams">
                      <Button variant="ghost" size="sm">
                        View {myTeams.length - 5} more teams
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Empty state - not in any teams
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
                <p className="mt-2 text-sm text-muted-foreground mb-4">
                  {totalTeams > 0
                    ? "Ask a team leader to add you to a team"
                    : "Create your first team to get started"}
                </p>
                {totalTeams === 0 && stats?.myTeamsCount === 0 && (
                  <Link href="/teams">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Team
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your teams</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUpdates ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentUpdates.length > 0 ? (
                <div className="space-y-4">
                  {recentUpdates.slice(0, 8).map((update: any) => (
                    <div
                      key={update.id}
                      className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/teams/${update.teamId}`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-white">
                          {update.user?.name?.[0] || "?"}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">
                            {update.user?.name}
                          </span>
                          {" submitted an update in "}
                          <span className="font-medium">
                            {update.team?.name}
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(update.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                          {update.processingStatus && (
                            <Badge
                              variant={
                                update.processingStatus === "completed"
                                  ? "default"
                                  : update.processingStatus === "processing"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {update.processingStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No recent activity yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updates will appear here once team members start submitting
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isMemberOfAnyTeam && (
                <Link href={`/teams/${myTeams[0].id}/submit`} className="block">
                  <Button className="w-full justify-start" variant="default">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Submit Daily Update
                  </Button>
                </Link>
              )}
              <Link href="/teams" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Layers className="mr-2 h-4 w-4" />
                  Browse Teams
                </Button>
              </Link>
              <Link href="/settings" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Organization
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Getting Started / Tips */}
          {!hasTeams || !isMemberOfAnyTeam ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Getting Started</CardTitle>
                <CardDescription>
                  Complete these steps to get the most out of Arc Logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                        hasTeams
                          ? "bg-green-100 text-green-700"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {hasTeams ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold">1</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-sm font-medium",
                          hasTeams ? "text-muted-foreground" : ""
                        )}
                      >
                        Create your first team
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Organize your daily updates
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                        isMemberOfAnyTeam
                          ? "bg-green-100 text-green-700"
                          : "bg-muted"
                      )}
                    >
                      {isMemberOfAnyTeam ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          2
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-sm font-medium",
                          !isMemberOfAnyTeam && hasTeams
                            ? ""
                            : "text-muted-foreground"
                        )}
                      >
                        Join or create teams
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add members to collaborate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                        hasSubmittedToday
                          ? "bg-green-100 text-green-700"
                          : "bg-muted"
                      )}
                    >
                      {hasSubmittedToday ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          3
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-sm font-medium",
                          hasSubmittedToday ? "text-muted-foreground" : ""
                        )}
                      >
                        Submit daily updates
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Replace standups with async updates
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Tips for active users
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base text-blue-900">
                  💡 Pro Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800">
                  {hasSubmittedToday
                    ? "Great work! Consistent updates help AI identify patterns and blockers more accurately."
                    : "Submit your daily updates at the same time each day to build a consistent habit."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{activeOrg?.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{orgMembersCount}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Teams</span>
                <span className="font-medium">{totalTeams}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
