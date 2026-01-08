// app/teams/[id]/standups/[configId]/responses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function ResponsesPage() {
  const router = useRouter();
  const [standup, setStandup] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const teamId = params.id as string;
  const configId = params.configId as string;

  useEffect(() => {
    async function loadData() {
      try {
        const [standupRes, responsesRes] = await Promise.all([
          fetch(`/api/standups/${configId}`),
          fetch(`/api/standups/${configId}/responses`),
        ]);

        if (standupRes.ok) {
          const data = await standupRes.json();
          setStandup(data.standup);
        }

        if (responsesRes.ok) {
          const data = await responsesRes.json();
          setResponses(data.responses);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [configId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Processed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <Link href={`/teams/${teamId}/standups`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Responses for {standup?.name}
          </h1>
          <p className="text-muted-foreground">View all standup submissions</p>
        </div>
      </div>

      {responses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No responses yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Team members haven't submitted any standups yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white">
                      {response.user?.name?.[0] || "?"}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {response.user?.name}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(response.responseDate).toLocaleDateString()}
                          <span>•</span>
                          {new Date(response.createdAt).toLocaleTimeString()}
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(response.processingStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {standup?.questions.map((question: any, index: number) => (
                  <div key={question.id} className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {index + 1}. {question.text}
                    </p>
                    <p className="text-sm pl-4 border-l-2 border-primary/20">
                      {response.responses[question.id] || (
                        <span className="text-muted-foreground italic">
                          No answer provided
                        </span>
                      )}
                    </p>
                  </div>
                ))}

                {response.aiInsights && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">🤖 AI Insights</p>
                    <div className="space-y-2 text-sm">
                      {response.aiInsights.blockers &&
                        response.aiInsights.blockers.length > 0 && (
                          <div>
                            <span className="font-medium">Blockers:</span>
                            <ul className="list-disc list-inside pl-4">
                              {response.aiInsights.blockers.map(
                                (blocker: string, i: number) => (
                                  <li key={i}>{blocker}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      {response.aiInsights.sentiment && (
                        <div>
                          <span className="font-medium">Sentiment:</span>{" "}
                          <Badge
                            variant={
                              response.aiInsights.sentiment === "positive"
                                ? "default"
                                : response.aiInsights.sentiment === "negative"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {response.aiInsights.sentiment}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
