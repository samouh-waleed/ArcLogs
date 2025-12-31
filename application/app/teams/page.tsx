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
import { Plus, Users, Loader2, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Use Better Auth hook for org data
  const { data: activeOrg } = authClient.useActiveOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const mutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setDialogOpen(false);
      setName("");
      setDescription("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const teams = data?.teams || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and their members
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new team</DialogTitle>
              <DialogDescription>
                Create a team to organize your daily standups and track
                progress.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {mutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {mutation.error instanceof Error
                        ? mutation.error.message
                        : "Failed to create team"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    placeholder="Engineering"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    disabled={mutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the team..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    disabled={mutation.isPending}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending || !name}>
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
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Get started by creating your first team to organize daily
              standups.
            </p>
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{team.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                  >
                    <Link href={`/dashboard/teams/${team.id}`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {team.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{team.teamMembers?.length || 0} members</span>
                </div>

                {/* Team members preview */}
                {team.teamMembers && team.teamMembers.length > 0 && (
                  <div className="mt-4 flex -space-x-2">
                    {team.teamMembers.slice(0, 5).map((member: any) => (
                      <div
                        key={member.id}
                        className=" h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium"
                        title={member.user?.name || member.user?.email}
                      >
                        {member.user?.name?.[0] ||
                          member.user?.email?.[0] ||
                          "?"}
                      </div>
                    ))}
                    {team.teamMembers.length > 5 && (
                      <div className=" h-8 w-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-medium">
                        +{team.teamMembers.length - 5}
                      </div>
                    )}
                  </div>
                )}

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/dashboard/teams/${team.id}`}>View Team</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
