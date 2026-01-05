// components/questions-calendar.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MessageSquare,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface QuestionsCalendarProps {
  teamId: string;
}

async function fetchCalendarData(
  teamId: string,
  startDate: string,
  endDate: string
) {
  const response = await fetch(
    `/api/teams/${teamId}/questions/calendar?start_date=${startDate}&end_date=${endDate}`
  );
  if (!response.ok) throw new Error("Failed to fetch calendar");
  return response.json();
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function QuestionsCalendar({ teamId }: QuestionsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Calculate calendar range (include previous/next month days)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startingDayOfWeek);

  const endDate = new Date(lastDayOfMonth);
  const remainingDays = 6 - endDate.getDay();
  endDate.setDate(endDate.getDate() + remainingDays);

  // Fetch calendar data for the month
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ["questions-calendar", teamId, year, month],
    queryFn: () =>
      fetchCalendarData(
        teamId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      ),
  });

  const calendar = calendarData?.calendar || {};

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    // 6 weeks * 7 days
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    calendarDays.push(date);
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const questions = calendar[dateStr] || [];
    setSelectedDate(dateStr);
    setSelectedQuestions(questions);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Questions Calendar
              </CardTitle>
              <CardDescription>
                View scheduled questions for each day
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[140px] text-center font-semibold">
                  {MONTHS[month]} {year}
                </div>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-muted/50">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const dateStr = date.toISOString().split("T")[0];
                const questions = calendar[dateStr] || [];
                const hasQuestions = questions.length > 0;
                const today = isToday(date);
                const currentMonth = isCurrentMonth(date);

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] p-2 border-r border-b cursor-pointer transition-colors",
                      "last:border-r-0",
                      index >= 35 && "border-b-0",
                      !currentMonth && "bg-muted/20",
                      today && "bg-primary/5 border-primary/20",
                      hasQuestions && "hover:bg-accent"
                    )}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          !currentMonth && "text-muted-foreground",
                          today && "text-primary font-bold"
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {hasQuestions && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {questions.length}
                        </Badge>
                      )}
                    </div>

                    {/* Show question indicators */}
                    {hasQuestions && (
                      <div className="space-y-1">
                        {questions
                          .slice(0, 3)
                          .map((question: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                            >
                              <MessageSquare className="inline h-3 w-3 mr-1" />
                              {question.question}
                            </div>
                          ))}
                        {questions.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{questions.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary/5 border border-primary/20" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-5 text-xs">
                3
              </Badge>
              <span>Number of questions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Questions for{" "}
              {selectedDate &&
                new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
            </DialogTitle>
            <DialogDescription>
              {selectedQuestions.length === 0
                ? "No questions scheduled for this day"
                : `${selectedQuestions.length} ${
                    selectedQuestions.length === 1 ? "question" : "questions"
                  } scheduled`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedQuestions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No questions scheduled for this day
                </p>
              </div>
            ) : (
              selectedQuestions.map((question: any, index: number) => (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Q{index + 1}
                          </span>
                          {question.required ? (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{question.question}</p>

                        {/* Schedule info */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {question.scheduleType === "daily" && "Every Day"}
                            {question.scheduleType === "weekly" && (
                              <>
                                Weekly:{" "}
                                {getWeekdayNames(question.scheduleConfig?.days)}
                              </>
                            )}
                            {question.scheduleType === "specific_dates" &&
                              "Specific Dates"}
                            {question.scheduleType === "custom" &&
                              "Custom Schedule"}
                          </Badge>

                          {question.effectiveFrom && (
                            <Badge variant="outline" className="text-xs">
                              From:{" "}
                              {new Date(
                                question.effectiveFrom
                              ).toLocaleDateString()}
                            </Badge>
                          )}

                          {question.effectiveUntil && (
                            <Badge variant="outline" className="text-xs">
                              Until:{" "}
                              {new Date(
                                question.effectiveUntil
                              ).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getWeekdayNames(days?: number[]): string {
  if (!days || days.length === 0) return "None";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d]).join(", ");
}
