// components/team-questions-tab-with-calendar.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  GripVertical,
  MoreVertical,
  Loader2,
  Edit,
  Trash,
  AlertCircle,
  MessageSquare,
  Calendar as CalendarIcon,
  List,
} from "lucide-react";
import QuestionsCalendar from "@/components/questions-calendar";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface TeamQuestionsTabProps {
  teamId: string;
}

async function fetchQuestions(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}/questions`);
  if (!response.ok) throw new Error("Failed to fetch questions");
  return response.json();
}

async function createQuestion(teamId: string, data: any) {
  const response = await fetch(`/api/teams/${teamId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create question");
  }
  return response.json();
}

async function updateQuestion(teamId: string, questionId: string, data: any) {
  const response = await fetch(`/api/teams/${teamId}/questions/${questionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update question");
  }
  return response.json();
}

async function deleteQuestion(teamId: string, questionId: string) {
  const response = await fetch(`/api/teams/${teamId}/questions/${questionId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete question");
  }
  return response.json();
}

export default function TeamQuestionsTab({ teamId }: TeamQuestionsTabProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [required, setRequired] = useState(true);
  const [scheduleType, setScheduleType] = useState<
    "daily" | "weekly" | "specific_dates"
  >("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [error, setError] = useState("");

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ["questions", teamId],
    queryFn: () => fetchQuestions(teamId),
  });

  const questions = Array.isArray(questionsData)
    ? questionsData
    : Array.isArray(questionsData?.questions)
    ? questionsData.questions
    : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => createQuestion(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", teamId] });
      queryClient.invalidateQueries({
        queryKey: ["questions-calendar", teamId],
      });
      closeDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: any }) =>
      updateQuestion(teamId, questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", teamId] });
      queryClient.invalidateQueries({
        queryKey: ["questions-calendar", teamId],
      });
      closeDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => deleteQuestion(teamId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", teamId] });
      queryClient.invalidateQueries({
        queryKey: ["questions-calendar", teamId],
      });
    },
  });

  const handleSave = () => {
    if (!questionText.trim()) {
      setError("Question text is required");
      return;
    }

    // Build schedule config
    let scheduleConfig: any = {};
    if (scheduleType === "daily") {
      scheduleConfig = { enabled: true };
    } else if (scheduleType === "weekly") {
      scheduleConfig = { days: selectedDays };
    }

    const data = {
      question: questionText,
      required,
      scheduleType,
      scheduleConfig,
      effectiveFrom: effectiveFrom || null,
      effectiveUntil: effectiveUntil || null,
      isActive: true,
    };

    if (editingQuestion) {
      updateMutation.mutate({ questionId: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const openEditDialog = (question: any) => {
    setEditingQuestion(question);
    setQuestionText(question.question);
    setRequired(question.required);
    setScheduleType(question.scheduleType || "daily");
    setSelectedDays(question.scheduleConfig?.days || [1, 2, 3, 4, 5]);
    setEffectiveFrom(question.effectiveFrom || "");
    setEffectiveUntil(question.effectiveUntil || "");
    setDialogOpen(true);
    setError("");
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
    setQuestionText("");
    setRequired(true);
    setScheduleType("daily");
    setSelectedDays([1, 2, 3, 4, 5]);
    setEffectiveFrom("");
    setEffectiveUntil("");
    setError("");
  };

  const handleToggleRequired = (question: any) => {
    updateMutation.mutate({
      questionId: question.id,
      data: { required: !question.required },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle & Header */}
      <div className="flex items-center justify-between">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "list" | "calendar")}
        >
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingQuestion(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion
                  ? "Update the question and its schedule."
                  : "Create a new question with a custom schedule."}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6 py-4">
              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  placeholder="What did you work on today?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
              </div>

              {/* Required Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="required">Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Members must answer this question
                  </p>
                </div>
                <Switch
                  id="required"
                  checked={required}
                  onCheckedChange={setRequired}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
              </div>

              {/* Schedule Type */}
              <div className="space-y-2">
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select
                  value={scheduleType}
                  onValueChange={(v: any) => setScheduleType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Every Day</SelectItem>
                    <SelectItem value="weekly">
                      Specific Days of Week
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekly Schedule */}
              {scheduleType === "weekly" && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WEEKDAYS.map(({ value, label }) => (
                      <Button
                        key={value}
                        type="button"
                        variant={
                          selectedDays.includes(value) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => toggleDay(value)}
                        className="justify-start"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  {selectedDays.length === 0 && (
                    <p className="text-sm text-destructive">
                      Select at least one day
                    </p>
                  )}
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effectiveFrom">Start Date (Optional)</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    When question becomes active
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveUntil">End Date (Optional)</Label>
                  <Input
                    id="effectiveUntil"
                    type="date"
                    value={effectiveUntil}
                    onChange={(e) => setEffectiveUntil(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    When question stops being active
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !questionText.trim() ||
                  (scheduleType === "weekly" && selectedDays.length === 0) ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingQuestion ? "Updating..." : "Creating..."}
                  </>
                ) : editingQuestion ? (
                  "Update Question"
                ) : (
                  "Add Question"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <QuestionsCalendar teamId={teamId} />
      ) : (
        <>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These questions will be asked to team members based on their
              schedules. Switch to Calendar View to see which days each question
              appears.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Daily Questions ({questions.length})</CardTitle>
              <CardDescription>
                Manage questions and their schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No questions yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground mb-4">
                    Add questions for team members to answer in their daily
                    updates.
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((question: any, index: number) => (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 rounded-lg border p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 pt-1">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}.
                          </span>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium">{question.question}</p>

                              {/* Schedule badges */}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {question.required ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Required
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Optional
                                  </Badge>
                                )}

                                <Badge variant="outline" className="text-xs">
                                  {question.scheduleType === "daily" &&
                                    "Every Day"}
                                  {question.scheduleType === "weekly" && (
                                    <>
                                      Weekly:{" "}
                                      {getWeekdayNames(
                                        question.scheduleConfig?.days
                                      )}
                                    </>
                                  )}
                                </Badge>

                                {question.effectiveFrom && (
                                  <Badge variant="outline" className="text-xs">
                                    From:{" "}
                                    {new Date(
                                      question.effectiveFrom
                                    ).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(question)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleRequired(question)}
                                >
                                  {question.required
                                    ? "Make Optional"
                                    : "Make Required"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this question?"
                                      )
                                    ) {
                                      deleteMutation.mutate(question.id);
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function getWeekdayNames(days?: number[]): string {
  if (!days || days.length === 0) return "None";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d]).join(", ");
}
