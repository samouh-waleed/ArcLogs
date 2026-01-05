"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

async function fetchQuestionsForToday(teamId: string) {
  // Get questions for today's date
  const today = new Date().toISOString().split("T")[0];
  const response = await fetch(
    `/api/teams/${teamId}/questions/calendar?date=${today}`
  );

  if (!response.ok) {
    // Fallback to all questions if calendar endpoint doesn't exist yet
    const fallbackResponse = await fetch(`/api/teams/${teamId}/questions`);
    if (!fallbackResponse.ok) throw new Error("Failed to fetch questions");
    const questions = await fallbackResponse.json();
    // Filter to active questions only
    return Array.isArray(questions)
      ? questions.filter((q: any) => q.isActive !== false)
      : [];
  }

  const data = await response.json();
  return data.questions || [];
}

async function submitUpdate(
  teamId: string,
  data: {
    content: Record<string, string>;
    updateType: "voice" | "text";
    voiceUrl?: string;
    voiceTranscript?: string;
    voiceDurationSeconds?: number;
  }
) {
  const response = await fetch(`/api/teams/${teamId}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit update");
  }
  return response.json();
}

export default function SubmitUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.teamId as string;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const { data: session } = authClient.useSession();

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ["team-questions-today", teamId],
    queryFn: () => fetchQuestionsForToday(teamId),
  });

  // Ensure questions is always an array
  const questions = Array.isArray(questionsData) ? questionsData : [];

  const mutation = useMutation({
    mutationFn: () =>
      submitUpdate(teamId, {
        content: answers,
        updateType: "text",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-updates", teamId] });
      queryClient.invalidateQueries({ queryKey: ["recent-updates"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      // Show success and redirect
      router.push(`/teams/${teamId}?submitted=true`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required questions
    const requiredQuestions = questions.filter((q: any) => q.required);
    const missingAnswers = requiredQuestions.filter(
      (q: any) => !answers[q.id] || answers[q.id].trim() === ""
    );

    if (missingAnswers.length > 0) {
      setError("Please answer all required questions");
      return;
    }

    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/teams/${teamId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Submit Update</h1>
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/teams/${teamId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Submit Update</h1>
            <p className="text-muted-foreground">No questions for today</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No Questions Scheduled
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There are no questions scheduled for today. Team leaders can add
              questions or adjust the schedule in the Questions tab.
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/teams/${teamId}`}>Back to Team</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/teams/${teamId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Submit Update
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Answer today's questions for your daily standup
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You can only submit one update per day. Make sure all your answers are
          complete before submitting.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Standup</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {questions.length}{" "}
              {questions.length === 1 ? "Question" : "Questions"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((question: any, index: number) => (
                <div key={question.id} className="space-y-3">
                  <Label htmlFor={question.id} className="text-base">
                    <span className="text-muted-foreground font-normal">
                      Q{index + 1}.
                    </span>{" "}
                    {question.question}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Textarea
                    id={question.id}
                    placeholder="Type your answer here..."
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    rows={4}
                    disabled={mutation.isPending}
                    required={question.required}
                    className="resize-none"
                  />
                  {question.required && (
                    <p className="text-xs text-muted-foreground">
                      This question is required
                    </p>
                  )}
                </div>
              ))}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/teams/${teamId}`)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Update
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">💡 Pro Tip</p>
              <p className="mt-1 text-blue-800">
                Be specific in your answers! Our AI analyzes your updates to
                identify blockers, help requests, and patterns that might need
                attention.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
