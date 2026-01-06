// app/settings/page.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useUpdateSubscriptionSeats } from "@/hooks/useUpdateSubscriptionSeats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  MoreVertical,
  Crown,
  Shield,
  User,
  Loader2,
  Mail,
  AlertCircle,
  Clock,
  X,
  Slack,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "owner" | "admin" | "member";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const updateSeats = useUpdateSubscriptionSeats();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [error, setError] = useState("");
  const [slackWorkspace, setSlackWorkspace] = useState<any>(null);
  const [loadingSlack, setLoadingSlack] = useState(true);

  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: isLoadingOrg } =
    authClient.useActiveOrganization();

  // Get full organization with members
  const { data: fullOrg, isPending: isLoadingFullOrg } = useQuery({
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

  // Get invitations
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["invitations", activeOrg?.id],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations();
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrg?.id,
  });

  // Load Slack workspace
  useQuery({
    queryKey: ["slack-workspace", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return null;

      const response = await fetch(
        `/api/slack/workspace?orgId=${activeOrg.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setSlackWorkspace(data.workspace);
        return data.workspace;
      }
      setSlackWorkspace(null);
      return null;
    },
    enabled: !!activeOrg?.id,
  });

  const invitations = Array.isArray(invitationsData)
    ? invitationsData.filter((inv: any) => inv.status === "pending")
    : [];

  const currentUserMember = fullOrg?.members?.find(
    (m: any) => m.userId === session?.user?.id
  );
  const isOwner = currentUserMember?.role === "owner";
  const isAdmin = currentUserMember?.role === "admin";
  const canManageMembers = isOwner || isAdmin;

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-full"] });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      setError("");
      // Update subscription seats
      if (activeOrg?.id) {
        updateSeats.mutate(activeOrg.id);
      }
    },
    onError: (err: any) => {
      setError(err.message || "Failed to send invitation");
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (error) throw error;
      return invitationId;
    },
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({
        queryKey: ["invitations", activeOrg?.id],
      });

      const previousInvitations = queryClient.getQueryData([
        "invitations",
        activeOrg?.id,
      ]);

      queryClient.setQueryData(["invitations", activeOrg?.id], (old: any) => {
        if (Array.isArray(old)) {
          return old.filter((inv: any) => inv.id !== invitationId);
        }
        return old;
      });

      return { previousInvitations };
    },
    onError: (err, invitationId, context: any) => {
      queryClient.setQueryData(
        ["invitations", activeOrg?.id],
        context?.previousInvitations
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["invitations", activeOrg?.id],
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberIdOrEmail: string) => {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-full"] });
      // Update subscription seats
      if (activeOrg?.id) {
        updateSeats.mutate(activeOrg.id);
      }
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: Role;
    }) => {
      const { error } = await authClient.organization.updateMemberRole({
        memberId,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-full"] });
    },
  });

  // Disconnect Slack mutation
  const disconnectSlackMutation = useMutation({
    mutationFn: async () => {
      if (!slackWorkspace?.id) throw new Error("No workspace to disconnect");

      const response = await fetch(
        `/api/slack/workspace/${slackWorkspace.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect Slack");
      }

      return response.json();
    },
    onSuccess: () => {
      setSlackWorkspace(null);
      queryClient.invalidateQueries({ queryKey: ["slack-workspace"] });
    },
    onError: (err: any) => {
      setError(err.message || "Failed to disconnect Slack");
    },
  });

  if (isLoadingOrg || isLoadingFullOrg) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!canManageMembers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Organization settings and member management
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Only organization owners and team leaders can manage settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "admin":
        return "Team Leader";
      default:
        return "Member";
    }
  };

  const handleConnectSlack = () => {
    if (!activeOrg?.id) return;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and team members
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input value={activeOrg?.name || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Organization ID</Label>
            <Input
              value={activeOrg?.slug || ""}
              disabled
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Slack Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Slack className="h-5 w-5" />
            Slack Integration
          </CardTitle>
          <CardDescription>
            Connect your Slack workspace for async standups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slackWorkspace ? (
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectSlack}
                  >
                    Reconnect
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={disconnectSlackMutation.isPending}
                      >
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Slack?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will stop all standup messages and remove the bot
                          from your workspace. You can reconnect at any time.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => disconnectSlackMutation.mutate()}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <Alert>
                <Slack className="h-4 w-4" />
                <AlertDescription>
                  Disconnecting will stop all scheduled standups and remove the
                  bot from your workspace.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Not Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your Slack workspace to start
                    </p>
                  </div>
                </div>
                <Button onClick={handleConnectSlack}>
                  <Slack className="mr-2 h-4 w-4" />
                  Connect Slack
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members & Invitations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Manage members and invitations</CardDescription>
          </div>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a team member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    disabled={inviteMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Team Leader</option>
                    {isOwner && <option value="owner">Owner</option>}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === "owner" && "Full organization control"}
                    {inviteRole === "admin" && "Can manage teams and members"}
                    {inviteRole === "member" && "Regular team member"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInviteDialogOpen(false);
                    setInviteEmail("");
                    setInviteRole("member");
                    setError("");
                  }}
                  disabled={inviteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => inviteMutation.mutate()}
                  disabled={!inviteEmail || inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">
                Members ({fullOrg?.members?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Pending Invitations ({invitations?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-3 mt-4">
              {fullOrg?.members?.map((member: any) => {
                const isCurrentUser = member.userId === session?.user?.id;
                const canManageThisMember =
                  canManageMembers &&
                  !isCurrentUser &&
                  !(member.role === "owner" && !isOwner);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white">
                        {member.user?.name?.[0] ||
                          member.user?.email?.[0] ||
                          "?"}
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

                    {canManageThisMember && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isOwner && member.role === "member" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    memberId: member.id,
                                    role: "admin",
                                  })
                                }
                              >
                                Promote to Team Leader
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    memberId: member.id,
                                    role: "owner",
                                  })
                                }
                              >
                                Promote to Owner
                              </DropdownMenuItem>
                            </>
                          )}
                          {isOwner && member.role === "admin" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    memberId: member.id,
                                    role: "owner",
                                  })
                                }
                              >
                                Promote to Owner
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    memberId: member.id,
                                    role: "member",
                                  })
                                }
                              >
                                Demote to Member
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              removeMemberMutation.mutate(member.user.email)
                            }
                            className="text-red-600"
                          >
                            Remove from Organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="invitations" className="space-y-3 mt-4">
              {isLoadingInvitations ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : !invitations || invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No pending invitations
                  </p>
                </div>
              ) : (
                invitations.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getRoleIcon(inv.role)}
                          <span>{getRoleLabel(inv.role)}</span>
                          <span>•</span>
                          <span>
                            Expires{" "}
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelInvitationMutation.mutate(inv.id)}
                      disabled={cancelInvitationMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
