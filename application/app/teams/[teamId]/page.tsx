"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  UserPlus,
  MoreVertical,
  Crown,
  Shield,
  User,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

async function fetchTeamDetail(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch team");
  }
  return response.json();
}

async function addTeamMember(teamId: string, userId: string) {
  const response = await fetch(`/api/teams/${teamId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add member");
  }
  return response.json();
}

async function removeTeamMember(teamId: string, userId: string) {
  const response = await fetch(
    `/api/teams/${teamId}/members?userId=${userId}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove member");
  }
  return response.json();
}

async function updateMemberRole(teamId: string, userId: string, role: string) {
  const response = await fetch(`/api/teams/${teamId}/members`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update role");
  }
  return response.json();
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.teamId as string;

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [error, setError] = useState("");

  // Get current user session and org
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  // Fetch team details
  const { data, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeamDetail(teamId),
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => addTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setAddMemberDialogOpen(false);
      setSelectedUserId("");
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(teamId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const team = data?.team;
  const userRole = data?.userRole;
  const canManageMembers = data?.canManageMembers;

  // Get org members not in team
  const availableMembers =
    activeOrg?.members.filter(
      (orgMember) =>
        !team?.teamMembers?.some(
          (teamMember: any) => teamMember.userId === orgMember.userId
        )
    ) || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "leader":
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "leader":
        return "Leader";
      default:
        return "Member";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team?.name}</h1>
            <p className="text-muted-foreground">
              {team?.description || "No description"}
            </p>
          </div>
        </div>

        {canManageMembers && (
          <Dialog
            open={addMemberDialogOpen}
            onOpenChange={setAddMemberDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add team member</DialogTitle>
                <DialogDescription>
                  Select a member from your organization to add to this team.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 py-4">
                {availableMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All organization members are already in this team.
                  </p>
                ) : (
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <span>
                              {member.user?.name || member.user?.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({getRoleLabel(member.role)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddMemberDialogOpen(false);
                    setSelectedUserId("");
                    setError("");
                  }}
                  disabled={addMemberMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => addMemberMutation.mutate(selectedUserId)}
                  disabled={
                    !selectedUserId ||
                    addMemberMutation.isPending ||
                    availableMembers.length === 0
                  }
                >
                  {addMemberMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({team?.teamMembers?.length || 0})</CardTitle>
          <CardDescription>
            Manage members and their roles in this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {team?.teamMembers?.map((member: any) => {
              const isCurrentUser = member.userId === session?.user?.id;
              const canManageThisMember = canManageMembers && !isCurrentUser;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {member.user?.name?.[0] || member.user?.email?.[0] || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {member.user?.name || member.user?.email}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getRoleIcon(member.role)}
                        <span>{getRoleLabel(member.role)}</span>
                      </div>
                    </div>
                  </div>

                  {(canManageThisMember || isCurrentUser) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManageThisMember && (
                          <>
                            {member.role === "member" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    userId: member.userId,
                                    role: "leader",
                                  })
                                }
                              >
                                Promote to Leader
                              </DropdownMenuItem>
                            )}
                            {member.role === "leader" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    userId: member.userId,
                                    role: "member",
                                  })
                                }
                              >
                                Demote to Member
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            removeMemberMutation.mutate(member.userId)
                          }
                          className="text-red-600"
                        >
                          {isCurrentUser ? "Leave Team" : "Remove from Team"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Settings - Only visible to leaders and org admins */}
      {(userRole === "leader" ||
        activeOrg?.members.find((m) => m.userId === session?.user?.id)?.role ===
          "owner" ||
        activeOrg?.members.find((m) => m.userId === session?.user?.id)?.role ===
          "admin") && (
        <Card>
          <CardHeader>
            <CardTitle>Team Settings</CardTitle>
            <CardDescription>
              Configure daily questions and team preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Team settings coming soon...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
