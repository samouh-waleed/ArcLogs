// components/team-updates-tab.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  AlertCircle,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function fetchTeamUpdates(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}/updates`);
  if (!response.ok) {
    throw new Error("Failed to fetch updates");
  }
  return response.json();
}

async function fetchQuestions(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}/questions`);
  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }
  return response.json();
}

interface TeamUpdatesTabProps {
  teamId: string;
  team: any;
}

export default function TeamUpdatesTab({ teamId, team }: TeamUpdatesTabProps) {
  const { data: updatesData, isLoading: isLoadingUpdates } = useQuery({
    queryKey: ["team-updates", teamId],
    queryFn: () => fetchTeamUpdates(teamId),
  });

  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["team-questions", teamId],
    queryFn: () => fetchQuestions(teamId),
  });

  const isLoading = isLoadingUpdates || isLoadingQuestions;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  // Handle both response formats: { updates: [...] } or [...]
  const updatesArray = Array.isArray(updatesData)
    ? updatesData
    : Array.isArray(updatesData?.updates)
    ? updatesData.updates
    : [];

  // Handle questions response
  const questionsArray = Array.isArray(questionsData)
    ? questionsData
    : Array.isArray(questionsData?.questions)
    ? questionsData.questions
    : [];

  // Create a map of question IDs to question text
  const questionMap = questionsArray.reduce((acc: any, q: any) => {
    acc[q.id] = q.question;
    return acc;
  }, {});

  if (updatesArray.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No updates yet</h3>
          <p className="mt-2 text-sm text-muted-foreground mb-4">
            Team members haven't submitted any daily updates yet.
          </p>
          <Link href={`/teams/${teamId}/submit`}>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit Your First Update
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Group updates by date
  const updatesByDate = updatesArray.reduce((acc: any, update: any) => {
    const date = new Date(update.updateDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(update);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(updatesByDate).map(
        ([date, dateUpdates]: [string, any]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium border-b pb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-base">{date}</span>
              <Badge variant="secondary" className="ml-auto">
                {dateUpdates.length}{" "}
                {dateUpdates.length === 1 ? "update" : "updates"}
              </Badge>
            </div>

            {dateUpdates.map((update: any) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white">
                        {update.user?.name?.[0] ||
                          update.user?.email?.[0] ||
                          "?"}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {update.user?.name || update.user?.email}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(update.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </CardDescription>
                      </div>
                    </div>

                    {update.processingStatus && (
                      <Badge
                        variant={
                          update.processingStatus === "completed"
                            ? "default"
                            : update.processingStatus === "processing"
                            ? "secondary"
                            : update.processingStatus === "failed"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {update.processingStatus}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Display answers with actual question text */}
                  {update.content && typeof update.content === "object" && (
                    <div className="space-y-4">
                      {Object.entries(update.content).map(
                        (
                          [questionId, answer]: [string, any],
                          index: number
                        ) => {
                          const questionText =
                            questionMap[questionId] || `Question ${index + 1}`;
                          // Truncate long questions
                          const displayQuestion =
                            questionText.length > 80
                              ? questionText.substring(0, 80) + "..."
                              : questionText;

                          return (
                            <div
                              key={questionId}
                              className="rounded-lg border-l-4 border-primary/20 bg-muted/30 p-4"
                            >
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                {displayQuestion}
                              </p>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {answer}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {/* Voice update */}
                  {update.updateType === "voice" && update.voiceUrl && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Voice update -{" "}
                        {update.voiceDurationSeconds
                          ? `${Math.floor(
                              update.voiceDurationSeconds / 60
                            )}:${String(
                              update.voiceDurationSeconds % 60
                            ).padStart(2, "0")}`
                          : "duration unknown"}
                        {update.voiceTranscript && (
                          <p className="mt-2 text-sm italic">
                            "{update.voiceTranscript}"
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* AI insights placeholder */}
                  {update.processingStatus === "completed" && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-sm">🤖</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">
                            AI Analysis
                          </p>
                          <p className="mt-1 text-sm text-blue-800">
                            AI-powered insights will appear here once the worker
                            processes this update. This will include blockers,
                            help requests, and patterns identified.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing status messages */}
                  {update.processingStatus === "processing" && (
                    <Alert>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        <AlertDescription>
                          AI is analyzing this update for blockers, help
                          requests, and patterns...
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}

                  {update.processingStatus === "failed" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to process this update. The team has been
                        notified.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
