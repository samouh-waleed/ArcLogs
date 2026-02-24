"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Slack,
  UserPlus,
  ClipboardList,
  Send,
  X,
  Sparkles,
  ExternalLink,
  Settings,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: () => void;
  href?: string;
  external?: boolean;
}

interface OnboardingChecklistProps {
  slackConnected: boolean;
  jiraConnected: boolean;
  hasTeams: boolean;
  hasMembers: boolean;
  hasStandups: boolean;
  organizationId: string;
}

export function OnboardingChecklist({
  slackConnected,
  jiraConnected,
  hasTeams,
  hasMembers,
  hasStandups,
  organizationId,
}: OnboardingChecklistProps) {
  const router = useRouter();

  // Initialize synchronously from localStorage/sessionStorage via lazy useState.
  // This runs before any useEffect, eliminating the race conditions where:
  //   • confetti fires because hasCompletedBefore hasn't loaded from localStorage yet
  //   • dismissed state fires a render before localStorage is read
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem(`onboarding-dismissed-${organizationId}`) === "true"
    );
  });

  const [hasCompletedBefore, setHasCompletedBefore] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem(`onboarding-completed-${organizationId}`) === "true"
    );
  });

  // True if this checklist was already shown earlier this session.
  // On revisit the lazy init reads the flag synchronously → hides immediately.
  const [seenThisSession] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      sessionStorage.getItem(`onboarding-seen-${organizationId}`) === "true"
    );
  });

  // Mark as seen for this session on first mount.
  useEffect(() => {
    sessionStorage.setItem(`onboarding-seen-${organizationId}`, "true");
  }, [organizationId]);

  const steps: OnboardingStep[] = [
    {
      id: "slack",
      title: "Connect Slack Workspace",
      description: "Install the ArcLogs bot to send standup requests",
      icon: <Slack className="h-4 w-4" />,
      completed: slackConnected,
      href: "/settings",
    },
    {
      id: "jira",
      title: "Connect Jira (Optional)",
      description: "Enable automatic ticket updates and comments",
      icon: <Settings className="h-4 w-4" />,
      completed: jiraConnected,
      href: "/settings/jira",
    },
    {
      id: "team",
      title: "Create Your First Team",
      description: "Organize members into teams",
      icon: <UserPlus className="h-4 w-4" />,
      completed: hasTeams,
      href: "/teams/new",
    },
    {
      id: "members",
      title: "Add Team Members",
      description: "Invite members from your Slack workspace",
      icon: <UserPlus className="h-4 w-4" />,
      completed: hasMembers,
      href: "/teams",
    },
    {
      id: "standup",
      title: "Configure Standup Questions",
      description: "Set up questions, schedule, and timezone",
      icon: <ClipboardList className="h-4 w-4" />,
      completed: hasStandups,
      href: "/teams",
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const allComplete = completedSteps === totalSteps;

  // Trigger confetti when all steps are complete
  useEffect(() => {
    if (allComplete && !hasCompletedBefore && !dismissed) {
      // Save completion state
      localStorage.setItem(`onboarding-completed-${organizationId}`, "true");
      setHasCompletedBefore(true);

      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [allComplete, hasCompletedBefore, dismissed, organizationId]);

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-dismissed-${organizationId}`, "true");
    setDismissed(true);
  };

  // Don't show if dismissed, all complete, or already seen this session
  if (dismissed || allComplete || seenThisSession) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Getting Started</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {completedSteps}/{totalSteps} Complete
              </Badge>
            </div>
            <CardDescription>
              Complete these steps to get the most out of ArcLogs
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-2 -mr-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                step.completed
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {step.icon}
                  <h4
                    className={`font-medium text-sm ${
                      step.completed
                        ? "text-green-700 dark:text-green-400"
                        : ""
                    }`}
                  >
                    {step.title}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
              {!step.completed && step.href && (
                <Link href={step.href}>
                  <Button size="sm" variant="ghost" className="h-8 text-xs">
                    {step.external ? (
                      <>
                        Go <ExternalLink className="ml-1 h-3 w-3" />
                      </>
                    ) : (
                      "Go"
                    )}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {progress > 0 && progress < 100 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You're making great progress! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
