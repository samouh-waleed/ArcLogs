"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Settings2,
  Users,
  Trash2,
  Archive,
  ExternalLink,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { TeamJiraConfig } from "@/components/team-jira-config";

export default function TeamSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Team data
  const [team, setTeam] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [channels, setChannels] = useState<any[]>([]);

  // Members data
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const { data: activeOrg } = authClient.useActiveOrganization();

  // Load team data
  useEffect(() => {
    async function loadData() {
      try {
        // Load team
        const teamResponse = await fetch(`/api/teams/${teamId}`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeam(teamData.team);
          setName(teamData.team.name);
          setDescription(teamData.team.description || "");
          setSelectedChannel(teamData.team.slackChannelId || "");
        }

        // Load Slack channels
        if (activeOrg?.id) {
          const channelsResponse = await fetch(
            `/api/slack/channels?orgId=${activeOrg.id}`
          );
          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            setChannels(channelsData.channels || []);
          }
        }
      } catch (error) {
        console.error("Failed to load team data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [teamId, activeOrg?.id]);

  // Load members
  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch(`/api/teams/${teamId}/members`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Failed to load members:", error);
      } finally {
        setLoadingMembers(false);
      }
    }

    loadMembers();
  }, [teamId]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const selectedChannelData = channels.find(
        (ch) => ch.id === selectedChannel
      );

      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          slackChannelId: selectedChannel || null,
          slackChannelName: selectedChannelData?.name || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update team");
      }

      setSuccess("Team settings updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveTeam = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive team");
      }

      router.push("/teams");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete team");
      }

      router.push("/teams");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/teams/${teamId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
        setSuccess("Member removed successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      setError("Failed to remove member");
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/teams/${teamId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
          <p className="text-muted-foreground">{team?.name}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="jira">Jira Integration</TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update basic information about your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Engineering, Marketing, Design"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this team do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel">Slack Channel (Optional)</Label>
                  <Select
                    value={selectedChannel || "none"}
                    onValueChange={(value) =>
                      setSelectedChannel(value === "none" ? "" : value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a channel for standup digests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          #{channel.name} {channel.isPrivate && "🔒"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Daily standup digests will be posted to this channel
                  </p>
                </div>

                <Button type="submit" disabled={loading || !name}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jira Integration */}
        <TabsContent value="jira">
          <TeamJiraConfig teamId={teamId} organizationId={activeOrg?.id || ""} />
        </TabsContent>

        {/* Members */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage who is part of this team
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/teams/${teamId}/members/add`}>
                    Add Member
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No members yet</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href={`/teams/${teamId}/members/add`}>
                      Add your first member
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium">
                            {member.user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                          {member.slackUserId && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Slack Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove{" "}
                              {member.user.name} from this team?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect this team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div>
                  <h4 className="font-medium">Archive Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Hide this team from active view (can be restored later)
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={loading}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Team?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will hide the team from active view. Standups will
                        be paused. You can restore it later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleArchiveTeam}>
                        Archive Team
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive rounded-lg bg-destructive/5">
                <div>
                  <h4 className="font-medium text-destructive">Delete Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this team and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the team, all members, standups, and responses.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTeam}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete Team
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
