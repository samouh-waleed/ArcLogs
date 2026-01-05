"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Users,
  FileText,
  Settings,
  MessageSquare,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import TeamMembersTab from "@/components/team-members-tab";
import TeamQuestionsTab from "@/components/team-questions-tab";
import TeamSettingsTab from "@/components/team-settings-tab";
import TeamUpdatesTab from "@/components/team-updates-tab";

async function fetchTeamDetail(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch team");
  }
  return response.json();
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const teamId = params.teamId as string;
  const defaultTab = searchParams.get("tab") || "updates";

  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const {
    data: team,
    isLoading: isLoadingTeam,
    error,
  } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeamDetail(teamId),
  });

  // Get full org
  const { data: fullOrg } = useQuery({
    queryKey: ["organization-full", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return null;

      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: {
            organizationId: activeOrg.id,
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to fetch organization");
      }

      return data;
    },
    enabled: !!activeOrg?.id,
  });

  if (isLoadingTeam) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/teams")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Team Not Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This team doesn't exist or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check user permissions
  const currentUserMember = fullOrg?.members?.find(
    (m: any) => m.userId === session?.user?.id
  );
  const isOwner = currentUserMember?.role === "owner";
  const isAdmin = currentUserMember?.role === "admin";

  const teamMemberData = team.teamMembers?.find(
    (tm: any) => tm.userId === session?.user?.id
  );
  const isTeamMember = !!teamMemberData;
  const isTeamLeader = teamMemberData?.role === "leader";

  const canManageTeam = isOwner || isAdmin || isTeamLeader;
  const memberCount = team.teamMembers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/teams")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
              {team.description && (
                <p className="text-muted-foreground">{team.description}</p>
              )}
            </div>
          </div>
        </div>

        {isTeamMember && (
          <Link href={`/teams/${teamId}/submit`}>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit Update
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">
              {isTeamMember ? "You're a member" : "Not a member"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Updates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Insights
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">AI analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="updates">
            <FileText className="mr-2 h-4 w-4" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          {canManageTeam && (
            <TabsTrigger value="questions">
              <MessageSquare className="mr-2 h-4 w-4" />
              Questions
            </TabsTrigger>
          )}
          {canManageTeam && (
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="updates" className="space-y-6">
          <TeamUpdatesTab teamId={teamId} team={team} />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <TeamMembersTab
            teamId={teamId}
            team={team}
            canManageTeam={canManageTeam}
            isTeamLeader={isTeamLeader}
          />
        </TabsContent>

        {canManageTeam && (
          <TabsContent value="questions" className="space-y-6">
            <TeamQuestionsTab teamId={teamId} />
          </TabsContent>
        )}

        {canManageTeam && (
          <TabsContent value="settings" className="space-y-6">
            <TeamSettingsTab teamId={teamId} team={team} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
