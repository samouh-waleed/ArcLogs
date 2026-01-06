// app/teams/[id]/analytics/page.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Clock,
  Users,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

const COLORS = {
  positive: "#22c55e",
  neutral: "#6b7280",
  negative: "#ef4444",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
};

export default function TeamAnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [teamRes, analyticsRes] = await Promise.all([
          fetch(`/api/teams/${params.id}`),
          fetch(`/api/teams/${params.id}/analytics?days=${timeRange}`),
        ]);

        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeam(data.team);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Process response rate data
  const responseRateData = analytics.responseRate.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    rate: ((item.response_count / item.total_members) * 100).toFixed(1),
    responses: item.response_count,
    total: item.total_members,
  }));

  // Process sentiment data
  const sentimentByDate = analytics.sentiment.reduce((acc: any, item: any) => {
    const date = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) {
      acc[date] = { date, positive: 0, neutral: 0, negative: 0 };
    }
    acc[date][item.sentiment || "neutral"] = parseInt(item.count);
    return acc;
  }, {});

  const sentimentData = Object.values(sentimentByDate);

  // Calculate sentiment distribution for pie chart
  const sentimentTotals = analytics.sentiment.reduce((acc: any, item: any) => {
    const sentiment = item.sentiment || "neutral";
    acc[sentiment] = (acc[sentiment] || 0) + parseInt(item.count);
    return acc;
  }, {});

  const sentimentPieData = Object.entries(sentimentTotals).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })
  );

  // Process blocker data
  const blockersByDate = analytics.blockers.reduce((acc: any, item: any) => {
    const date = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) {
      acc[date] = { date, critical: 0, high: 0, medium: 0, low: 0 };
    }
    acc[date][item.severity] = parseInt(item.count);
    return acc;
  }, {});

  const blockerData = Object.values(blockersByDate);

  // Process help request data
  const helpRequestsByDate = analytics.helpRequests.reduce(
    (acc: any, item: any) => {
      const date = new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) {
        acc[date] = { date, open: 0, resolved: 0 };
      }
      acc[date][item.status] = parseInt(item.count);
      return acc;
    },
    {}
  );

  const helpRequestData = Object.values(helpRequestsByDate);

  // Calculate participation percentage
  const expectedDays = parseInt(timeRange);
  const participationData = analytics.memberParticipation.map(
    (member: any) => ({
      name: member.name,
      participation: ((member.days_responded / expectedDays) * 100).toFixed(1),
      daysResponded: member.days_responded,
      sentimentScore: (
        parseFloat(member.avg_sentiment_score || 0) * 100
      ).toFixed(0),
    })
  );

  const stats = analytics.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/teams/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Analytics for {team?.name}
            </h1>
            <p className="text-muted-foreground">
              Team health and performance insights
            </p>
          </div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Responses
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">Standup submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockers</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBlockers}</div>
            <p className="text-xs text-muted-foreground">Issues identified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Help Requests</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.resolvedHelpRequests}/{stats.totalHelpRequests}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHelpRequests > 0
                ? `${Math.round(
                    (stats.resolvedHelpRequests / stats.totalHelpRequests) * 100
                  )}% resolved`
                : "No requests"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Processing Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">AI analysis time</p>
          </CardContent>
        </Card>
      </div>

      {/* Response Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Response Rate Over Time</CardTitle>
          <CardDescription>
            Percentage of team members submitting standups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={responseRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Date
                            </span>
                            <span className="font-bold">
                              {payload[0].payload.date}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Rate
                            </span>
                            <span className="font-bold">
                              {payload[0].payload.rate}%
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Responses
                            </span>
                            <span className="font-bold">
                              {payload[0].payload.responses}/
                              {payload[0].payload.total}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Over Time</CardTitle>
            <CardDescription>Team mood trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" stackId="a" fill={COLORS.positive} />
                <Bar dataKey="neutral" stackId="a" fill={COLORS.neutral} />
                <Bar dataKey="negative" stackId="a" fill={COLORS.negative} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Overall team sentiment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS[entry.name.toLowerCase() as keyof typeof COLORS]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Blockers Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Blocker Trends</CardTitle>
          <CardDescription>Issues by severity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={blockerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="critical" stackId="a" fill="#dc2626" />
              <Bar dataKey="high" stackId="a" fill="#ea580c" />
              <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
              <Bar dataKey="low" stackId="a" fill="#84cc16" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Help Requests Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Help Requests</CardTitle>
          <CardDescription>Open vs resolved requests</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={helpRequestData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="open" fill="#ef4444" />
              <Bar dataKey="resolved" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Member Participation */}
      <Card>
        <CardHeader>
          <CardTitle>Member Participation</CardTitle>
          <CardDescription>
            Individual contribution and sentiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {participationData.map((member: any) => (
              <div
                key={member.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white">
                    {member.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.daysResponded} responses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {member.participation}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Participation
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        member.sentimentScore > 66
                          ? "default"
                          : member.sentimentScore > 33
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {member.sentimentScore > 66 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : member.sentimentScore > 33 ? (
                        <BarChart3 className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {member.sentimentScore}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Blockers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Blockers</CardTitle>
          <CardDescription>Top issues affecting the team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topBlockers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No blockers reported 🎉
              </p>
            ) : (
              analytics.topBlockers.map((blocker: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 ${
                      blocker.severity === "critical"
                        ? "text-red-600"
                        : blocker.severity === "high"
                        ? "text-orange-600"
                        : blocker.severity === "medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{blocker.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          blocker.severity === "critical" ||
                          blocker.severity === "high"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {blocker.severity}
                      </Badge>
                      <Badge
                        variant={
                          blocker.status === "open" ? "default" : "secondary"
                        }
                      >
                        {blocker.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(blocker.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
