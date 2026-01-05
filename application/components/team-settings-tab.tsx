// components/team-settings-tab.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Trash2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
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

async function updateTeam(teamId: string, data: any) {
  const response = await fetch(`/api/teams/${teamId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update team");
  }
  return response.json();
}

async function deleteTeam(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete team");
  }
  return response.json();
}

interface TeamSettingsTabProps {
  teamId: string;
  team: any;
}

export default function TeamSettingsTab({
  teamId,
  team,
}: TeamSettingsTabProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [name, setName] = useState(team.name || "");
  const [description, setDescription] = useState(team.description || "");
  const [membersCanSeeUpdates, setMembersCanSeeUpdates] = useState(
    team.membersCanSeeUpdates || false
  );
  const [membersCanSeeInsights, setMembersCanSeeInsights] = useState(
    team.membersCanSeeInsights || true
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTeam(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      setSuccess("Team updated successfully");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeam(teamId),
    onSuccess: () => {
      router.push("/teams");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }
    updateMutation.mutate({
      name,
      description,
      membersCanSeeUpdates,
      membersCanSeeInsights,
    });
  };

  const hasChanges =
    name !== team.name ||
    description !== (team.description || "") ||
    membersCanSeeUpdates !== team.membersCanSeeUpdates ||
    membersCanSeeInsights !== team.membersCanSeeInsights;

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>
            Update your team's name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.isPending}
              placeholder="Engineering, Marketing, Sales..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
              placeholder="What does this team work on?"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !name.trim() || !hasChanges}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility & Permissions</CardTitle>
          <CardDescription>
            Control what team members can see and do
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base">Members Can See All Updates</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, all team members can view each other's daily
                updates. When disabled, only team leaders can see all updates.
              </p>
            </div>
            <Switch
              checked={membersCanSeeUpdates}
              onCheckedChange={setMembersCanSeeUpdates}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base">Members Can See AI Insights</Label>
              <p className="text-sm text-muted-foreground">
                Allow team members to view AI-generated insights, blockers, and
                help requests. Leaders can always see insights.
              </p>
            </div>
            <Switch
              checked={membersCanSeeInsights}
              onCheckedChange={setMembersCanSeeInsights}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Team leaders and organization admins always
              have full visibility regardless of these settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Update Edit Window */}
      <Card>
        <CardHeader>
          <CardTitle>Update Settings</CardTitle>
          <CardDescription>
            Configure how updates work for this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base">Edit Window</Label>
              <p className="text-sm text-muted-foreground">
                Team members can edit their updates within{" "}
                {team.updateEditWindowMinutes || 60} minutes after submission.
              </p>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {team.updateEditWindowMinutes || 60} min
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Customizable edit windows coming soon. Currently fixed at 60
              minutes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium">Delete this team</p>
              <p className="text-sm text-muted-foreground mt-1">
                Once you delete a team, there is no going back. This will
                permanently delete the team, all its updates, questions, and
                insights. Team members will no longer have access.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Team
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the team
                    <strong> "{team.name}"</strong> and remove all associated
                    data including:
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>All daily updates and answers</li>
                      <li>All questions and configurations</li>
                      <li>All AI-generated insights</li>
                      <li>Team member associations</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, delete team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
