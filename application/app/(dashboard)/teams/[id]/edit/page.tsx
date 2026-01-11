// app/teams/[id]/edit/page.tsx
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
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function EditTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [channels, setChannels] = useState<any[]>([]);

  const params = useParams();
  const teamId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");

  const { data: activeOrg } = authClient.useActiveOrganization();

  useEffect(() => {
    async function loadData() {
      try {
        // Load team
        const teamResponse = await fetch(`/api/teams/${teamId}`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setName(teamData.team.name);
          setDescription(teamData.team.description || "");
          setSelectedChannel(teamData.team.slackChannelId || "");
        }

        // Load channels
        if (activeOrg?.id) {
          const channelsResponse = await fetch(
            `/api/slack/channels?orgId=${activeOrg.id}`
          );
          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            setChannels(channelsData.channels);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [teamId, activeOrg?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

      router.push(`/teams/${teamId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/teams/${teamId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Team</h1>
          <p className="text-muted-foreground">Update team information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
          <CardDescription>
            Update basic information about your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                value={selectedChannel}
                onValueChange={setSelectedChannel}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel for standup results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name} {channel.isPrivate && "🔒"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Daily standup summaries will be posted to this channel
              </p>
            </div>

            <div className="flex gap-3">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/teams/${teamId}`)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
