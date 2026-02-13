// app/(dashboard)/settings/jira/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  CheckCircle,
  MessageSquare,
  Edit,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface JiraLink {
  id: string;
  jiraIssueKey: string;
  jiraIssueUrl: string | null;
  actionType: string;
  syncedAt: string;
  errorMessage: string | null;
  standupResponse: {
    user: {
      name: string;
      email: string;
    };
    team: {
      name: string;
    };
  } | null;
}

export default function JiraHistoryPage() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [links, setLinks] = useState<JiraLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLinks() {
      if (!activeOrg?.id) return;

      try {
        const response = await fetch(`/api/jira/links?orgId=${activeOrg.id}&limit=50`);
        if (response.ok) {
          const data = await response.json();
          setLinks(data.links);
        }
      } catch (error) {
        console.error("Failed to load Jira links:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLinks();
  }, [activeOrg?.id]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "create":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "update":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    const variants: Record<string, any> = {
      create: "default",
      update: "secondary",
      comment: "outline",
    };

    return (
      <Badge variant={variants[actionType] || "default"}>
        {actionType.toUpperCase()}
      </Badge>
    );
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
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings/jira">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jira Sync History</h1>
          <p className="text-muted-foreground">
            View all Jira tickets created and updated from standups
          </p>
        </div>
      </div>

      {links.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Jira syncs yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once team members mention blockers in standups, Jira tickets will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Syncs</CardTitle>
            <CardDescription>
              Last {links.length} Jira sync{links.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getActionIcon(link.actionType)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium">
                          {link.jiraIssueKey}
                        </span>
                        {getActionBadge(link.actionType)}
                        {link.errorMessage && (
                          <Badge variant="destructive" className="text-xs">
                            ERROR
                          </Badge>
                        )}
                      </div>

                      {link.standupResponse && (
                        <div className="text-sm text-muted-foreground">
                          {link.standupResponse.user.name} •{" "}
                          {link.standupResponse.team.name} •{" "}
                          {new Date(link.syncedAt).toLocaleString()}
                        </div>
                      )}

                      {link.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          {link.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {link.jiraIssueUrl && !link.errorMessage && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={link.jiraIssueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sync Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">
                {links.filter((l) => l.actionType === "create").length}
              </span>
              <span className="text-sm text-muted-foreground">Tickets Created</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">
                {links.filter((l) => l.actionType === "update").length}
              </span>
              <span className="text-sm text-muted-foreground">Tickets Updated</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-red-600">
                {links.filter((l) => l.errorMessage).length}
              </span>
              <span className="text-sm text-muted-foreground">Errors</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
