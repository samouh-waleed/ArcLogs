"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Users,
  ClipboardList,
  Settings as SettingsIcon,
  Send,
  Sparkles,
  Clock,
  Calendar,
  Slack,
  Lock,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

interface TeamSetupWizardProps {
  organizationId: string;
}

interface Question {
  id: string;
  text: string;
  required: boolean;
}

const DAYS_OF_WEEK = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

const DEFAULT_QUESTIONS: Question[] = [
  { id: "1", text: "What did you work on yesterday?", required: true },
  { id: "2", text: "What are you working on today?", required: true },
  { id: "3", text: "Any blockers or challenges?", required: false },
];

export function TeamSetupWizard({ organizationId }: TeamSetupWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Team Basics
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [channels, setChannels] = useState<any[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Step 2: Members
  const [slackUsers, setSlackUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Step 3: Standup Config
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);
  const [allowVoice, setAllowVoice] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/organization-usage?orgId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        const allowed = data.features?.voice ?? false;
        setVoiceEnabled(allowed);
        if (!allowed) setAllowVoice(false);
      })
      .catch(() => setVoiceEnabled(false));
  }, [organizationId]);

  // Step 4: Jira (Optional)
  const [jiraConnected, setJiraConnected] = useState(false);
  const [useJiraOverride, setUseJiraOverride] = useState(false);
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraBoardId, setJiraBoardId] = useState("");

  // Step 5: Created team ID for testing
  const [createdTeamId, setCreatedTeamId] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Load Slack channels
  useEffect(() => {
    async function loadChannels() {
      setLoadingChannels(true);
      try {
        const response = await fetch(
          `/api/slack/channels?orgId=${organizationId}`
        );
        if (response.ok) {
          const data = await response.json();
          setChannels(data.channels || []);
        }
      } catch (error) {
        console.error("Failed to load channels:", error);
      } finally {
        setLoadingChannels(false);
      }
    }

    if (currentStep === 1) {
      loadChannels();
    }
  }, [currentStep, organizationId]);

  // Load Slack users
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const response = await fetch(
          `/api/slack/users?orgId=${organizationId}`
        );
        if (response.ok) {
          const data = await response.json();
          setSlackUsers(data.users || []);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoadingUsers(false);
      }
    }

    if (currentStep === 2) {
      loadUsers();
    }
  }, [currentStep, organizationId]);

  // Check Jira connection
  useEffect(() => {
    async function checkJira() {
      try {
        const response = await fetch(`/api/jira/connection`);
        if (response.ok) {
          const data = await response.json();
          setJiraConnected(!!data.connection);
        }
      } catch (error) {
        console.error("Failed to check Jira:", error);
      }
    }

    if (currentStep === 4) {
      checkJira();
    }
  }, [currentStep]);

  const handleNext = async () => {
    setError("");

    // Validate current step
    if (currentStep === 1) {
      if (!teamName.trim()) {
        setError("Team name is required");
        return;
      }
    }

    if (currentStep === 2) {
      if (selectedUsers.length === 0) {
        setError("Please select at least one team member");
        return;
      }
    }

    if (currentStep === 3) {
      if (questions.some((q) => !q.text.trim())) {
        setError("All questions must have text");
        return;
      }
      if (selectedDays.length === 0) {
        setError("Please select at least one day");
        return;
      }
    }

    // If moving to step 5, create the team
    if (currentStep === 4) {
      await createTeam();
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const createTeam = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Create team
      const selectedChannelData = channels.find(
        (ch) => ch.id === selectedChannel
      );

      const teamResponse = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          organizationId,
          slackChannelId: selectedChannel || null,
          slackChannelName: selectedChannelData?.name || null,
          jiraProjectKey: useJiraOverride ? jiraProjectKey || null : null,
          jiraBoardId: useJiraOverride ? jiraBoardId || null : null,
        }),
      });

      if (!teamResponse.ok) {
        const data = await teamResponse.json();
        throw new Error(data.error || "Failed to create team");
      }

      const teamData = await teamResponse.json();
      const teamId = teamData.team.id;
      setCreatedTeamId(teamId);

      // 2. Add members
      const membersToAdd = selectedUsers
        .map((slackUserId) => {
          const slackUser = slackUsers.find((u) => u.id === slackUserId);
          if (!slackUser) return null;
          return {
            email: slackUser.email,
            slackUserId: slackUser.id,
            name: slackUser.name,
          };
        })
        .filter(Boolean);

      if (membersToAdd.length > 0) {
        const membersRes = await fetch(`/api/teams/${teamId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members: membersToAdd }),
        });
        if (!membersRes.ok) {
          const data = await membersRes.json();
          console.error("Failed to add members:", data.error);
        }
      }

      // 3. Create standup config
      const standupRes = await fetch("/api/standups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          name: teamName,
          questions,
          scheduleTime,
          timezone,
          scheduleDays: selectedDays,
          allowVoiceResponses: allowVoice,
        }),
      });
      if (!standupRes.ok) {
        const data = await standupRes.json();
        console.error("Failed to create standup:", data.error);
      }

      // Move to final step
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/teams/${createdTeamId}/trigger-standup`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          type: "success",
          message: `✅ Test standup sent to ${data.sent} team member(s)!`,
        });
      } else {
        setTestResult({
          type: "error",
          message: data.error || "Failed to send test standup",
        });
      }
    } catch (error) {
      setTestResult({
        type: "error",
        message: "Failed to send test standup",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleFinish = () => {
    router.push(`/teams/${createdTeamId}`);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now().toString(), text: "", required: false },
    ]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Team Basics */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Team Basics</CardTitle>
                <CardDescription>
                  Give your team a name and description
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Team Name *
                <span className="text-xs text-muted-foreground ml-2">
                  (e.g., Engineering, Marketing, Design)
                </span>
              </Label>
              <Input
                id="name"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What does this team do?"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">
                <div className="flex items-center gap-2">
                  <Slack className="h-4 w-4" />
                  Slack Channel (Optional)
                </div>
              </Label>
              {loadingChannels ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading channels...
                </div>
              ) : (
                <Select
                  value={selectedChannel || "none"}
                  onValueChange={(value) =>
                    setSelectedChannel(value === "none" ? "" : value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel for digests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name} {channel.isPrivate && "🔒"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Daily standup digests will be posted here
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Members */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Add Team Members</CardTitle>
                <CardDescription>
                  Select members from your Slack workspace
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Slack users...
              </div>
            ) : slackUsers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No Slack users found. Make sure your Slack workspace is
                  connected.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {selectedUsers.length} of {slackUsers.length} selected
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {slackUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure Standup */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Configure Standup</CardTitle>
                <CardDescription>
                  Set up questions, schedule, and preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Questions */}
            <div className="space-y-3">
              <Label>Questions</Label>
              {questions.map((question, index) => (
                <div key={question.id} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={`Question ${index + 1}`}
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(question.id, "text", e.target.value)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${question.id}`}
                        checked={question.required}
                        onCheckedChange={(checked) =>
                          updateQuestion(question.id, "required", checked)
                        }
                      />
                      <Label
                        htmlFor={`required-${question.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Required
                      </Label>
                    </div>
                  </div>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addQuestion}
                className="w-full"
              >
                + Add Question
              </Button>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule
                </div>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm">
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm">
                    Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">
                        Eastern (ET)
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central (CT)
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain (MT)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific (PT)
                      </SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Days */}
            <div className="space-y-3">
              <Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Days
                </div>
              </Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Badge
                    key={day.value}
                    variant={
                      selectedDays.includes(day.value) ? "default" : "outline"
                    }
                    className="cursor-pointer px-4 py-2"
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Voice Responses */}
            {voiceEnabled === false ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Allow Voice Responses
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Voice standups require a Pro plan.{" "}
                    <Link href="/billing" className="text-primary underline">
                      Upgrade to Pro
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Allow Voice Responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Team members can record audio instead of typing
                  </p>
                </div>
                <Switch
                  checked={allowVoice}
                  onCheckedChange={setAllowVoice}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Jira (Optional) */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Jira Integration (Optional)</CardTitle>
                <CardDescription>
                  Configure Jira project for this team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!jiraConnected ? (
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No Jira connection found. You can connect Jira now or skip
                    and configure it later.
                  </AlertDescription>
                </Alert>
                <a
                  href="/settings/jira"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
                >
                  Connect Jira
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                  <div>
                    <p className="font-medium">✓ Jira Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Organization-level Jira is configured
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Use Custom Jira Project</Label>
                    <p className="text-sm text-muted-foreground">
                      Override org default with team-specific project
                    </p>
                  </div>
                  <Switch
                    checked={useJiraOverride}
                    onCheckedChange={setUseJiraOverride}
                  />
                </div>

                {useJiraOverride && (
                  <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                    <div className="space-y-2">
                      <Label htmlFor="projectKey">Project Key</Label>
                      <Input
                        id="projectKey"
                        placeholder="e.g., SCRUM"
                        value={jiraProjectKey}
                        onChange={(e) =>
                          setJiraProjectKey(e.target.value.toUpperCase())
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardId">Board ID (Optional)</Label>
                      <Input
                        id="boardId"
                        placeholder="e.g., 123"
                        value={jiraBoardId}
                        onChange={(e) => setJiraBoardId(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Success & Test */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Team Created Successfully!</CardTitle>
                <CardDescription>
                  Your team is ready. Send a test standup to verify everything
                  works.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <h4 className="font-medium mb-2">✓ Setup Complete</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Team "{teamName}" created</li>
                <li>• {selectedUsers.length} members added</li>
                <li>• Standup configured with {questions.length} questions</li>
                <li>
                  • Schedule: {scheduleTime} on {selectedDays.join(", ")}
                </li>
                {useJiraOverride && jiraProjectKey && (
                  <li>• Jira project: {jiraProjectKey}</li>
                )}
              </ul>
            </div>

            {testResult && (
              <Alert
                variant={testResult.type === "error" ? "destructive" : "default"}
                className={
                  testResult.type === "success"
                    ? "bg-green-50 border-green-200"
                    : undefined
                }
              >
                {testResult.type === "success" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription
                  className={
                    testResult.type === "success" ? "text-green-800" : undefined
                  }
                >
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSendTest}
                disabled={sendingTest}
                variant="outline"
                className="flex-1"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Standup
                  </>
                )}
              </Button>
              <Button onClick={handleFinish} className="flex-1">
                <Sparkles className="mr-2 h-4 w-4" />
                Go to Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : currentStep === 4 ? (
              <>
                Create Team
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
