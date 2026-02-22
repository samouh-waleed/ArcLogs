"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  XCircle,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface TeamJiraConfigProps {
  teamId: string;
  organizationId: string;
}

export function TeamJiraConfig({
  teamId,
  organizationId,
}: TeamJiraConfigProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Org-level Jira connection
  const [jiraConnection, setJiraConnection] = useState<any>(null);

  // Team-level override
  const [team, setTeam] = useState<any>(null);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [projectKey, setProjectKey] = useState("");
  const [boardId, setBoardId] = useState("");

  const [jiraEnabled, setJiraEnabled] = useState<boolean | null>(null); // null = still loading

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        // Check plan before anything else
        if (organizationId) {
          const usageRes = await fetch(
            `/api/organization-usage?orgId=${organizationId}`
          );
          if (usageRes.ok) {
            const usage = await usageRes.json();
            const allowed = usage.features?.jira ?? false;
            setJiraEnabled(allowed);
            if (!allowed) return; // skip Jira/team fetch for free plan
          }
        }

        // Load org-level Jira connection
        const jiraResponse = await fetch(`/api/jira/connection`);
        if (jiraResponse.ok) {
          const jiraData = await jiraResponse.json();
          setJiraConnection(jiraData.connection);
        }

        // Load team data
        const teamResponse = await fetch(`/api/teams/${teamId}`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeam(teamData.team);

          // Check if team has override
          if (teamData.team.jiraProjectKey || teamData.team.jiraBoardId) {
            setOverrideEnabled(true);
            setProjectKey(teamData.team.jiraProjectKey || "");
            setBoardId(teamData.team.jiraBoardId || "");
          }
        }
      } catch (error) {
        console.error("Failed to load Jira config:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [teamId, organizationId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jiraProjectKey: overrideEnabled ? projectKey || null : null,
          jiraBoardId: overrideEnabled ? boardId || null : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update Jira configuration");
      }

      setSuccess("Jira configuration updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/jira/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey: overrideEnabled ? projectKey : jiraConnection?.defaultProjectKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Connection test failed");
      }

      const data = await response.json();
      setSuccess(
        `✓ Connected to Jira project: ${data.project?.name || projectKey}`
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loadingData || jiraEnabled === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jira Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jiraEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jira Integration</CardTitle>
          <CardDescription>
            Automatic ticket updates from standup responses
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center py-8 gap-4">
          <div className="rounded-full bg-muted p-3">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Jira integration requires Pro</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Upgrade to Pro to connect Jira and enable automatic ticket creation,
              status transitions, and smart comments.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/billing">Upgrade to Pro</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!jiraConnection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jira Integration</CardTitle>
          <CardDescription>
            Connect Jira to enable automatic ticket updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No Jira connection configured at organization level.
              <br />
              <Link
                href="/settings/jira"
                className="text-primary underline mt-2 inline-flex items-center gap-1"
              >
                Connect Jira in Settings
                <ExternalLink className="h-3 w-3" />
              </Link>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jira Integration</CardTitle>
        <CardDescription>
          Configure Jira project settings for this team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Organization-level Jira status */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Organization Jira Connection</h4>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Domain:</span>{" "}
              {jiraConnection.jiraDomain}
            </p>
            <p>
              <span className="font-medium">Default Project:</span>{" "}
              {jiraConnection.defaultProjectKey || "Not set"}
            </p>
            {jiraConnection.defaultIssueType && (
              <p>
                <span className="font-medium">Default Issue Type:</span>{" "}
                {jiraConnection.defaultIssueType}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Override toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="override">Override Jira Project</Label>
              <p className="text-sm text-muted-foreground">
                Use a different Jira project for this team
              </p>
            </div>
            <Switch
              id="override"
              checked={overrideEnabled}
              onCheckedChange={(checked) => {
                setOverrideEnabled(checked);
                if (!checked) {
                  setProjectKey("");
                  setBoardId("");
                }
              }}
              disabled={loading}
            />
          </div>

          {/* Override fields */}
          {overrideEnabled && (
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
              <div className="space-y-2">
                <Label htmlFor="projectKey">
                  Project Key *
                  <span className="text-xs text-muted-foreground ml-2">
                    (e.g., SCRUM, TEAM, PROJ)
                  </span>
                </Label>
                <Input
                  id="projectKey"
                  placeholder="e.g., SCRUM"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  disabled={loading}
                  required={overrideEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  The Jira project key for this team's work
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="boardId">
                  Board ID (Optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    (e.g., 123)
                  </span>
                </Label>
                <Input
                  id="boardId"
                  placeholder="e.g., 123"
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Specific Jira board ID for sprint and workflow detection
                </p>
              </div>
            </div>
          )}

          {/* Current configuration summary */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Active Configuration
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Project Key:</span>{" "}
                <code className="px-2 py-0.5 rounded bg-muted">
                  {overrideEnabled && projectKey
                    ? projectKey
                    : jiraConnection.defaultProjectKey || "Not set"}
                </code>
                {overrideEnabled && projectKey && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Team Override
                  </Badge>
                )}
              </p>
              {(overrideEnabled && boardId) || jiraConnection.defaultBoardId ? (
                <p>
                  <span className="text-muted-foreground">Board ID:</span>{" "}
                  <code className="px-2 py-0.5 rounded bg-muted">
                    {overrideEnabled && boardId
                      ? boardId
                      : jiraConnection.defaultBoardId}
                  </code>
                </p>
              ) : null}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || loading}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            💡 <strong>Tip:</strong> Team-level overrides allow different teams
            to work in different Jira projects while sharing the same
            organization connection.
          </p>
          <p>
            📌 The worker will use your team's project key when fetching sprint
            issues and updating tickets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
