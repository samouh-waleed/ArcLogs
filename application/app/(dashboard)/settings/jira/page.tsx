// app/(dashboard)/settings/jira/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  TestTube,
} from "lucide-react";

interface JiraConnection {
  id: string;
  jiraDomain: string;
  jiraEmail: string;
  jiraApiToken: string;
  defaultProjectKey: string | null;
  defaultIssueType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function JiraSettingsPage() {
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const [connection, setConnection] = useState<JiraConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [jiraDomain, setJiraDomain] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [defaultProjectKey, setDefaultProjectKey] = useState("");
  const [defaultIssueType, setDefaultIssueType] = useState("Task");

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    user?: { displayName: string; emailAddress: string };
    error?: string;
  } | null>(null);

  // Load existing connection
  useEffect(() => {
    async function loadConnection() {
      if (!activeOrg?.id) return;

      try {
        const response = await fetch(
          `/api/jira/connection?orgId=${activeOrg.id}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.connection) {
            setConnection(data.connection);
            setJiraDomain(data.connection.jiraDomain);
            setJiraEmail(data.connection.jiraEmail);
            setJiraApiToken(data.connection.jiraApiToken);
            setDefaultProjectKey(data.connection.defaultProjectKey || "");
            setDefaultIssueType(data.connection.defaultIssueType || "Task");
          }
        }
      } catch (error) {
        console.error("Failed to load Jira connection:", error);
      } finally {
        setLoading(false);
      }
    }

    loadConnection();
  }, [activeOrg?.id]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/jira/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jiraDomain,
          jiraEmail,
          jiraApiToken,
        }),
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        setMessage({
          type: "success",
          text: `✅ Connection successful! Authenticated as ${data.user.displayName}`,
        });
      } else {
        // Show both error and details if available
        const errorText = data.details
          ? `❌ Connection failed: ${data.error} - ${data.details}`
          : `❌ Connection failed: ${data.error}`;
        setMessage({
          type: "error",
          text: errorText,
        });
        console.error("[Jira Test UI] Error details:", data);
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error("[Jira Test UI] Exception in handleTestConnection:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage({
        type: "error",
        text: `Failed to test connection: ${errorMessage}`,
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!activeOrg?.id) return;

    // Validate required fields
    if (!jiraDomain || !jiraEmail || !jiraApiToken || !defaultProjectKey) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields (Domain, Email, API Token, and Project Key)",
      });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/jira/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrg.id,
          jiraDomain,
          jiraEmail,
          jiraApiToken,
          defaultProjectKey,
          defaultIssueType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConnection(data.connection);
        setMessage({
          type: "success",
          text: "Jira connection saved successfully!",
        });

        setTimeout(() => setMessage(null), 5000);
      } else {
        const data = await response.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to save connection",
        });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to save connection",
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeOrg?.id) return;
    if (!confirm("Are you sure you want to remove Jira integration?")) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/jira/connection?orgId=${activeOrg.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setConnection(null);
        setJiraDomain("");
        setJiraEmail("");
        setJiraApiToken("");
        setDefaultProjectKey("");
        setDefaultIssueType("Task");
        setMessage({
          type: "success",
          text: "Jira integration removed",
        });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to remove integration",
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jira Integration</h1>
        <p className="text-muted-foreground">
          Connect your Jira workspace to automatically create tickets from standup blockers
        </p>
      </div>

      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className={
            message.type === "success"
              ? "bg-green-50 border-green-200"
              : undefined
          }
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription
            className={
              message.type === "success" ? "text-green-800" : undefined
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Jira Configuration</CardTitle>
          <CardDescription>
            Configure your Jira Cloud instance credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jiraDomain">Jira Domain *</Label>
            <Input
              id="jiraDomain"
              placeholder="company.atlassian.net"
              value={jiraDomain}
              onChange={(e) => setJiraDomain(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Your Jira Cloud domain (without https://)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraEmail">Jira Email *</Label>
            <Input
              id="jiraEmail"
              type="email"
              placeholder="bot@company.com"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Email address for API authentication
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraApiToken">API Token *</Label>
            <Input
              id="jiraApiToken"
              type="password"
              placeholder="ATATT3xFfGF0..."
              value={jiraApiToken}
              onChange={(e) => setJiraApiToken(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Generate from{" "}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Atlassian API Tokens
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultProjectKey">Default Project Key *</Label>
            <Input
              id="defaultProjectKey"
              placeholder="PROJ"
              value={defaultProjectKey}
              onChange={(e) =>
                setDefaultProjectKey(e.target.value.toUpperCase())
              }
              disabled={saving}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Project key for auto-created tickets (e.g., PROJ, ENG, DEV) - Required for auto-creation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultIssueType">Default Issue Type</Label>
            <Select
              value={defaultIssueType}
              onValueChange={setDefaultIssueType}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Task">Task</SelectItem>
                <SelectItem value="Bug">Bug</SelectItem>
                <SelectItem value="Story">Story</SelectItem>
                <SelectItem value="Blocker">Blocker</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default type for auto-created tickets
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={
                testing ||
                saving ||
                !jiraDomain ||
                !jiraEmail ||
                !jiraApiToken
              }
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={
                saving ||
                testing ||
                !jiraDomain ||
                !jiraEmail ||
                !jiraApiToken
              }
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>

            {connection && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </>
                )}
              </Button>
            )}
          </div>

          {testResult && testResult.success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Connected as <strong>{testResult.user?.displayName}</strong> (
                {testResult.user?.emailAddress})
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Jira Integration Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              🎯 Automatic Ticket Creation
            </h4>
            <p>
              When team members mention blockers in their standup (e.g., "Blocked
              on API access"), ArcLogs automatically creates a Jira ticket.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              🔄 Smart Updates
            </h4>
            <p>
              If someone mentions a Jira key (e.g., "PROJ-123") in their standup,
              we'll add a comment with their update.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              🛡️ No Duplicates
            </h4>
            <p>
              Edit your standup response multiple times - we'll never create
              duplicate tickets for the same blocker.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              💬 Instant Notifications
            </h4>
            <p>
              Users receive a Slack DM with links to created/updated Jira tickets
              immediately after their standup is processed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
