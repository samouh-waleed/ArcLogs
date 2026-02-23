// app/teams/[id]/standups/page.tsx
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
import {
  ArrowLeft,
  Plus,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Play,
  Pause,
  Loader2,
  Send,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StandupsPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [standups, setStandups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    type: "success" | "warning" | "error";
    message: string;
    details?: string[];
  } | null>(null);
  const [membersWithoutSlack, setMembersWithoutSlack] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const params = useParams();
  const teamId = params.id as string;
  const { data: activeOrg } = authClient.useActiveOrganization();

  useEffect(() => {
    async function loadData() {
      try {
        const [teamRes, standupsRes] = await Promise.all([
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/standups?teamId=${teamId}`),
        ]);

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeam(teamData.team);
        }

        if (standupsRes.ok) {
          const standupsData = await standupsRes.json();
          setStandups(standupsData.standups);
        }

        // Check how many team members are missing Slack user IDs
        const membersRes = await fetch(`/api/teams/${teamId}/members`);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const members = membersData.members || [];
          setTotalMembers(members.length);
          setMembersWithoutSlack(
            members.filter((m: any) => !m.slackUserId).length
          );
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id, teamId]);

  const handleTest = async (standupId: string) => {
    setTesting(standupId);
    setTestResult(null);
    try {
      const response = await fetch(`/api/teams/${params.id}/trigger-standup`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        if (data.sent === 0) {
          setTestResult({
            type: "warning",
            message: `Sent to 0 members — team members need to be linked to Slack.`,
            details: data.errors,
          });
          // Refresh the member count so the banner updates
          setMembersWithoutSlack(totalMembers);
        } else {
          setTestResult({
            type: "success",
            message: `Sent test standup to ${data.sent} member${data.sent !== 1 ? "s" : ""}.${
              data.errors?.length ? ` (${data.errors.length} skipped — see below)` : ""
            }`,
            details: data.errors,
          });
        }
      } else {
        setTestResult({
          type: "error",
          message: data.error || "Failed to send test standup.",
        });
      }
    } catch (error) {
      console.error("Failed to test standup:", error);
      setTestResult({ type: "error", message: "Failed to send test standup." });
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (standupId: string) => {
    setDeleting(standupId);
    try {
      const response = await fetch(`/api/standups/${standupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStandups(standups.filter((s) => s.id !== standupId));
      }
    } catch (error) {
      console.error("Failed to delete standup:", error);
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (standupId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/standups/${standupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const { standup } = await response.json();
        setStandups(standups.map((s) => (s.id === standupId ? standup : s)));
      }
    } catch (error) {
      console.error("Failed to toggle standup:", error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/teams/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Standups for {team?.name}
          </h1>
          <p className="text-muted-foreground">
            Configure async standup schedules
          </p>
        </div>
        <Button asChild>
          <Link href={`/teams/${params.id}/standups/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Standup
          </Link>
        </Button>
      </div>

      {/* Warning: members missing Slack user IDs */}
      {totalMembers > 0 && membersWithoutSlack > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <span className="font-medium">
              {membersWithoutSlack === totalMembers
                ? "No team members are linked to Slack"
                : `${membersWithoutSlack} of ${totalMembers} members are not linked to Slack`}
            </span>
            {" — standups won't reach them. "}
            <Link
              href={`/teams/${teamId}/members`}
              className="underline font-medium"
            >
              Re-add members from the Slack workspace picker →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Test standup result */}
      {testResult && (
        <Alert
          className={
            testResult.type === "success"
              ? "border-green-300 bg-green-50"
              : testResult.type === "warning"
              ? "border-amber-300 bg-amber-50"
              : "border-destructive bg-destructive/5"
          }
        >
          {testResult.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle
              className={`h-4 w-4 ${
                testResult.type === "warning"
                  ? "text-amber-600"
                  : "text-destructive"
              }`}
            />
          )}
          <AlertDescription
            className={
              testResult.type === "success"
                ? "text-green-800"
                : testResult.type === "warning"
                ? "text-amber-800"
                : "text-destructive"
            }
          >
            <p className="font-medium">{testResult.message}</p>
            {testResult.details && testResult.details.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
                {testResult.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {standups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No standups yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first standup configuration to get started
            </p>
            <Button asChild className="mt-4">
              <Link href={`/teams/${params.id}/standups/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Standup
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {standups.map((standup) => (
            <Card key={standup.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {standup.name}
                      {standup.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {standup.questions.length} questions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {standup.scheduleTime} ({standup.timezone})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {standup.scheduleDays
                        .map((day: number) => DAYS[day])
                        .join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(standup.id)}
                    disabled={testing === standup.id}
                  >
                    {testing === standup.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Test Now
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(standup.id, standup.isActive)}
                  >
                    {standup.isActive ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/teams/${params.id}/standups/${standup.id}/edit`}
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleting === standup.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Standup</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{standup.name}"? This
                          will stop all scheduled standups.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(standup.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
