// app/(dashboard)/billing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Users,
  DollarSign,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Check,
  X,
  Sparkles,
  Crown,
} from "lucide-react";
import Link from "next/link";

const PRICE_PER_USER = 8; // $8/user/month

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: isLoadingOrg } =
    authClient.useActiveOrganization();

  // Get full org with members
  const { data: fullOrg, isPending: isLoadingFullOrg } = useQuery({
    queryKey: ["organization-full", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return null;

      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: {
            organizationId: activeOrg.id,
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to fetch organization");
      }

      return data;
    },
    enabled: !!activeOrg?.id,
  });

  // Get organization usage
  const { data: usage } = useQuery({
    queryKey: ["organization-usage", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return null;
      const response = await fetch(
        `/api/organization-usage?orgId=${activeOrg.id}`
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!activeOrg?.id,
  });

  const currentUserMember = fullOrg?.members?.find(
    (m: any) => m.userId === session?.user?.id
  );
  const isOwner = currentUserMember?.role === "owner";
  const isAdmin = currentUserMember?.role === "admin";
  const canManageBilling = isOwner || isAdmin;

  // Load subscriptions
  useEffect(() => {
    async function loadSubscriptions() {
      if (!activeOrg?.id) return;

      try {
        const { data, error } = await authClient.subscription.list({
          query: {
            referenceId: activeOrg.id,
          },
        });

        if (error) {
          console.error("Failed to load subscriptions:", error);
          setSubscriptions([]);
        } else {
          setSubscriptions(data || []);
        }
      } catch (err) {
        console.error("Error loading subscriptions:", err);
        setSubscriptions([]);
      } finally {
        setLoadingSubscriptions(false);
      }
    }

    loadSubscriptions();
  }, [activeOrg?.id]);

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.upgrade({
        plan: "pro",
        referenceId: activeOrg?.id,
        seats: fullOrg?.members?.length || 1,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing`,
      });

      if (error) {
        throw new Error(error.message || "Failed to create subscription");
      }

      return data;
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await authClient.subscription.cancel({
        subscriptionId,
        referenceId: activeOrg?.id,
        returnUrl: `${window.location.origin}/billing`,
      });

      if (error) {
        throw new Error(error.message || "Failed to cancel subscription");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["organization-usage"] });
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Restore subscription mutation
  const restoreMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await authClient.subscription.restore({
        subscriptionId,
        referenceId: activeOrg?.id,
      });

      if (error) {
        throw new Error(error.message || "Failed to restore subscription");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["organization-usage"] });
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Billing portal mutation
  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.billingPortal({
        referenceId: activeOrg?.id,
        returnUrl: `${window.location.origin}/billing`,
      });

      if (error) {
        throw new Error(error.message || "Failed to open billing portal");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (isLoadingOrg || isLoadingFullOrg || loadingSubscriptions) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!canManageBilling) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Only organization owners and team leaders can view billing
              information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "active" || sub.status === "trialing"
  );

  // Determine current plan
  const currentPlan =
    activeSubscription?.status === "trialing"
      ? "trial"
      : activeSubscription?.status === "active"
      ? "pro"
      : "free";

  const isFreePlan = currentPlan === "free";
  const isTrialPlan = currentPlan === "trial";
  const isProPlan = currentPlan === "pro";

  const memberCount = fullOrg?.members?.length || 1;
  const monthlyAmount = memberCount * PRICE_PER_USER;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "trialing":
        return (
          <Badge className="bg-blue-500">
            <Sparkles className="mr-1 h-3 w-3" />
            Trial
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Past Due
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Canceled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view usage
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Display */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan Card */}
        <Card className={isFreePlan ? "border-primary shadow-lg" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Free Plan
                  {isFreePlan && <Badge variant="default">Current Plan</Badge>}
                </CardTitle>
                <CardDescription>
                  Perfect for trying out ArcLogs
                </CardDescription>
              </div>
              <div className="text-3xl font-bold">$0</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>1 team</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Up to 5 members</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>1 standup configuration</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Basic AI insights</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <X className="h-4 w-4" />
                <span>Unlimited teams</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <X className="h-4 w-4" />
                <span>Advanced analytics</span>
              </div>
            </div>

            {isFreePlan && usage && (
              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-medium">Current Usage:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium">
                      {usage.members.current}/{usage.members.limit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teams</span>
                    <span className="font-medium">
                      {usage.teams.current}/{usage.teams.limit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standups</span>
                    <span className="font-medium">
                      {usage.standups.current}/{usage.standups.limit}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isFreePlan && (
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro Plan Card */}
        <Card
          className={
            isProPlan || isTrialPlan
              ? "border-primary shadow-lg relative"
              : "relative"
          }
        >
          {(isProPlan || isTrialPlan) && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-primary to-primary/80">
                <Crown className="mr-1 h-3 w-3" />
                {isTrialPlan ? "Trial Active" : "Current Plan"}
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Pro Plan
                  {isTrialPlan && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      14-Day Trial
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isProPlan
                    ? "Unlimited everything for growing teams"
                    : isTrialPlan
                    ? "Try all Pro features free for 14 days"
                    : "Unlimited everything for your team"}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${PRICE_PER_USER}</div>
                <div className="text-xs text-muted-foreground">
                  per user/month
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">Unlimited teams</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">Unlimited members</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">Unlimited standups</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Advanced AI insights</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Team analytics dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Priority support</span>
              </div>
            </div>

            {(isProPlan || isTrialPlan) && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team Members</span>
                  <span className="font-bold text-lg">{memberCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Cost</span>
                  <span className="font-bold text-lg">
                    ${monthlyAmount.toFixed(2)}
                  </span>
                </div>
                {activeSubscription?.periodEnd && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isTrialPlan ? "Trial Ends" : "Next Billing"}
                    </span>
                    <span className="font-medium">
                      {new Date(
                        activeSubscription.periodEnd
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {isTrialPlan && (
              <Alert className="bg-blue-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Your trial ends on{" "}
                  {new Date(activeSubscription.periodEnd).toLocaleDateString()}.
                  No payment required until then!
                </AlertDescription>
              </Alert>
            )}

            {isFreePlan && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => subscribeMutation.mutate()}
                disabled={subscribeMutation.isPending || !isOwner}
              >
                {subscribeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro - ${monthlyAmount}/month
                  </>
                )}
              </Button>
            )}

            {(isProPlan || isTrialPlan) && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => billingPortalMutation.mutate()}
                  disabled={billingPortalMutation.isPending}
                >
                  {billingPortalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Manage Billing
                </Button>

                {activeSubscription.cancelAtPeriodEnd ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      restoreMutation.mutate(activeSubscription.id)
                    }
                    disabled={restoreMutation.isPending || !isOwner}
                  >
                    {restoreMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Restore Plan"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => cancelMutation.mutate(activeSubscription.id)}
                    disabled={cancelMutation.isPending || !isOwner}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Cancel Plan"
                    )}
                  </Button>
                )}
              </div>
            )}

            {!isOwner && isFreePlan && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only organization owners can upgrade the plan.
                </AlertDescription>
              </Alert>
            )}

            {activeSubscription?.cancelAtPeriodEnd && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will cancel on{" "}
                  {new Date(activeSubscription.periodEnd).toLocaleDateString()}.
                  You'll continue to have access until then.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How Billing Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Billing Works</CardTitle>
          <CardDescription>Simple, transparent pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold">Per User Pricing</h4>
              <p className="text-sm text-muted-foreground">
                Pay only ${PRICE_PER_USER}/month for each team member. Add or
                remove members anytime.
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold">Automatic Updates</h4>
              <p className="text-sm text-muted-foreground">
                Your bill automatically adjusts when you add or remove team
                members. Pro-rated instantly.
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold">Cancel Anytime</h4>
              <p className="text-sm text-muted-foreground">
                No long-term contracts. Cancel your subscription anytime with no
                fees or penalties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your subscription history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">ArcLogs Pro</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {sub.seats || 1}{" "}
                        {sub.seats === 1 ? "member" : "members"}
                      </span>
                      {sub.periodStart && (
                        <>
                          <span>•</span>
                          <span>
                            Started{" "}
                            {new Date(sub.periodStart).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {getStatusBadge(sub.status)}
                    {sub.cancelAtPeriodEnd && (
                      <p className="text-xs text-muted-foreground">
                        Ends {new Date(sub.periodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
