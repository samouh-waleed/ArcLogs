// app/teams/[id]/help-requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function HelpRequestsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamRes, helpRes] = await Promise.all([
          fetch(`/api/teams/${params.id}`),
          fetch(`/api/teams/${params.id}/help-requests`),
        ]);

        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeam(data.team);
        }

        if (helpRes.ok) {
          const data = await helpRes.json();
          setHelpRequests(data.helpRequests);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  const markResolved = async (requestId: string) => {
    try {
      const response = await fetch(`/api/help-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });

      if (response.ok) {
        setHelpRequests(
          helpRequests.map((req) =>
            req.id === requestId ? { ...req, status: "resolved" } : req
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark resolved:", error);
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/teams/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Help Requests for {team?.name}
          </h1>
          <p className="text-muted-foreground">
            Team members asking for assistance
          </p>
        </div>
      </div>

      {helpRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No help requests</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Team members haven't requested help yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {helpRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{request.topic}</CardTitle>
                    <CardDescription className="mt-2">
                      Requested by {request.requester?.name} •{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {request.status === "open" ? (
                    <Badge variant="default">
                      <HelpCircle className="mr-1 h-3 w-3" />
                      Open
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Resolved
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{request.description}</p>

                {request.mentionedSlackUserIds &&
                  request.mentionedSlackUserIds.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Mentions:</span>{" "}
                      {request.mentionedSlackUserIds.join(", ")}
                    </div>
                  )}

                {request.status === "open" && (
                  <Button size="sm" onClick={() => markResolved(request.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Resolved
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
