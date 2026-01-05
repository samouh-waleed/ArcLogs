// components/team-members-tab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  MoreVertical,
  Crown,
  Shield,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";

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

interface TeamMembersTabProps {
  teamId: string;
  team: any;
  canManageTeam: boolean;
  isTeamLeader: boolean;
}

export default function TeamMembersTab({
  teamId,
  team,
  canManageTeam,
  isTeamLeader,
}: TeamMembersTabProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  // Get org members for adding to team
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
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!activeOrg?.id,
  });

  const addMutation = useMutation({
    mutationFn: (userId: string) => addTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      setDialogOpen(false);
      setSelectedUserId("");
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(teamId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    },
  });

  // Get available members to add (org members not in team)
  const availableMembers = fullOrg?.members?.filter(
    (orgMember: any) =>
      !team.teamMembers?.some((tm: any) => tm.userId === orgMember.userId)
  );

  const getRoleIcon = (role: string) => {
    if (role === "leader") {
      return <Crown className="h-4 w-4 text-yellow-500" />;
    }
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getRoleLabel = (role: string) => {
    return role === "leader" ? "Team Leader" : "Member";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Team Members ({team.teamMembers?.length || 0})</CardTitle>
          <CardDescription>
            Manage who can submit updates to this team
          </CardDescription>
        </div>

        {canManageTeam && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  Add someone from your organization to this team.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Member</label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={addMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers?.map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.user?.name || member.user?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableMembers?.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      All organization members are already in this team.
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedUserId("");
                    setError("");
                  }}
                  disabled={addMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => addMutation.mutate(selectedUserId)}
                  disabled={!selectedUserId || addMutation.isPending}
                >
                  {addMutation.isPending ? (
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
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {team.teamMembers?.map((member: any) => {
            const isCurrentUser = member.userId === session?.user?.id;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white">
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

                {canManageTeam && !isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === "member" ? (
                        <DropdownMenuItem
                          onClick={() =>
                            updateRoleMutation.mutate({
                              userId: member.userId,
                              role: "leader",
                            })
                          }
                        >
                          Promote to Team Leader
                        </DropdownMenuItem>
                      ) : (
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
                      <DropdownMenuItem
                        onClick={() => removeMutation.mutate(member.userId)}
                        className="text-red-600"
                      >
                        Remove from Team
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
  );
}
