"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Loader2,
  Settings,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

async function fetchTeams() {
  const response = await fetch("/api/teams");
  if (!response.ok) {
    throw new Error("Failed to fetch teams");
  }
  return response.json();
}

async function createTeam(data: { name: string; description?: string }) {
  const response = await fetch("/api/teams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create team");
  }

  return response.json();
}

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  // Get full org with members
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

  // Check user role
  const currentUserMember = fullOrg?.members?.find(
    (m: any) => m.userId === session?.user?.id
  );
  const isOwner = currentUserMember?.role === "owner";
  const isAdmin = currentUserMember?.role === "admin";
  const canCreateTeam = isOwner || isAdmin;

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  // Ensure teams is always an array
  const teams = Array.isArray(teamsData)
    ? teamsData
    : Array.isArray(teamsData?.teams)
    ? teamsData.teams
    : [];

  const mutation = useMutation({
    mutationFn: createTeam,
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setDialogOpen(false);
      setName("");
      setDescription("");
      setError("");

      // Navigate to new team
      router.push(`/teams/${newTeam.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }
    mutation.mutate({ name, description });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and their daily updates
          </p>
        </div>

        {canCreateTeam && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create a new team</DialogTitle>
                  <DialogDescription>
                    Create a team to organize daily updates and track progress.
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name *</Label>
                    <Input
                      id="name"
                      placeholder="Engineering, Marketing, Sales..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={mutation.isPending}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What does this team work on?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={mutation.isPending}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setName("");
                      setDescription("");
                      setError("");
                    }}
                    disabled={mutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!name.trim() || mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Team"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
            <p className="mt-2 text-sm text-muted-foreground mb-4">
              {canCreateTeam
                ? "Get started by creating your first team."
                : "Ask an admin to create a team."}
            </p>
            {canCreateTeam && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => {
            const memberCount = team.teamMembers?.length || 0;
            const isTeamMember = team.teamMembers?.some(
              (tm: any) => tm.userId === session?.user?.id
            );

            return (
              <Card
                key={team.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/teams/${team.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {team.name}
                        {isTeamMember && (
                          <Badge variant="secondary" className="text-xs">
                            Member
                          </Badge>
                        )}
                      </CardTitle>
                      {team.description && (
                        <CardDescription className="mt-1.5 line-clamp-2">
                          {team.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {memberCount}{" "}
                          {memberCount === 1 ? "member" : "members"}
                        </span>
                      </div>
                      {isTeamMember && (
                        <Link
                          href={`/teams/${team.id}/submit`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Submit Update
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Link
                        href={`/teams/${team.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        View Team
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      {(isOwner || isAdmin) && (
                        <Link
                          href={`/teams/${team.id}?tab=settings`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      {teams.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">About Arc Logs Teams</p>
                <p className="mt-1 text-blue-800">
                  Teams help you organize daily async updates. Each team member
                  submits their daily progress, and our AI identifies blockers,
                  help requests, and patterns automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
