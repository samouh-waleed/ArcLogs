// app/teams/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Edit,
  Plus,
  Users,
  Settings,
  Trash2,
  Crown,
  Shield,
  User,
  TrendingUp,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadTeam() {
      if (!teamId) return; // ← Guard against undefined

      try {
        const response = await fetch(`/api/teams/${teamId}`);
        if (response.ok) {
          const data = await response.json();
          setTeam(data.team);
        } else {
          router.push("/teams");
        }
      } catch (error) {
        console.error("Failed to load team:", error);
        router.push("/teams");
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [teamId, router]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/teams");
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleTriggerStandup = async () => {
    setTriggering(true);
    setTriggerMessage(null);
    try {
      const response = await fetch(`/api/teams/${teamId}/trigger-standup`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setTriggerMessage({
          type: "success",
          text: data.message || `Sent ${data.sent} standup prompt(s)!`,
        });
      } else {
        setTriggerMessage({
          type: "error",
          text: data.error || "Failed to trigger standup",
        });
      }

      // Clear message after 5 seconds
      setTimeout(() => setTriggerMessage(null), 5000);
    } catch (error) {
      console.error("Failed to trigger standup:", error);
      setTriggerMessage({
        type: "error",
        text: "Network error - failed to trigger standup",
      });
      setTimeout(() => setTriggerMessage(null), 5000);
    } finally {
      setTriggering(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "leader":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          {team.description && (
            <p className="text-muted-foreground">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/teams/${team.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Team</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{team.name}"? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleting ? "Deleting..." : "Delete Team"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {triggerMessage && (
        <Alert
          variant={triggerMessage.type === "error" ? "destructive" : "default"}
          className={
            triggerMessage.type === "success"
              ? "bg-green-50 border-green-200"
              : undefined
          }
        >
          {triggerMessage.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription
            className={
              triggerMessage.type === "success" ? "text-green-800" : undefined
            }
          >
            {triggerMessage.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.teamMembers?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standups</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {team.standupConfigs?.length || 0}
            </div>
            <div className="flex flex-col gap-1">
              <Button variant="link" className="p-0 h-auto text-xs justify-start" asChild>
                <Link href={`/teams/${team.id}/standups`}>Manage standups →</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerStandup}
                disabled={triggering || (team.standupConfigs?.length || 0) === 0}
                className="w-full"
              >
                {triggering ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-3 w-3" />
                    Test Standup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Channel</CardTitle>
          </CardHeader>
          <CardContent>
            {team.slackChannelName ? (
              <div className="text-sm">#{team.slackChannelName}</div>
            ) : (
              <div className="text-sm text-muted-foreground">Not set</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/teams/${team.id}/analytics`}>View Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              People who will receive standup questions
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/teams/${team.id}/members`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Members
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!team.teamMembers || team.teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No members yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add team members to start sending standups
              </p>
              <Button asChild className="mt-4">
                <Link href={`/teams/${team.id}/members`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Members
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {team.teamMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white">
                      {member.user?.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{member.user?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className="text-sm capitalize">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
