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
} from "lucide-react";

const PRICE_PER_USER = 8; // $8/user/month

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  const { data: session } = authClient.useSession();
  const { data: activeOrg, isPending: isLoadingOrg } =
    authClient.useActiveOrganization();

  // Get full org with members using useQuery
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

  // Current user's role - 'admin' displays as 'Team Leader'
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
            <AlertCircle className="mr-1 h-3 w-3" />
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
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your subscription is based on the number of team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Arc Logs Pro</h3>
                <p className="text-sm text-muted-foreground">
                  ${PRICE_PER_USER}/user/month
                </p>
              </div>
            </div>
            {activeSubscription && (
              <div>{getStatusBadge(activeSubscription.status)}</div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Team Members</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{memberCount}</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Monthly Cost</span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                ${monthlyAmount.toFixed(2)}
              </p>
            </div>

            {activeSubscription && activeSubscription.periodEnd && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Next Billing</span>
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {new Date(activeSubscription.periodEnd).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="font-medium text-blue-900">How billing works</h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>• Pay ${PRICE_PER_USER}/month per team member</li>
              <li>• Add or remove members anytime</li>
              <li>• Automatic quantity updates via webhooks</li>
              <li>• Cancel anytime, no commitment</li>
            </ul>
          </div>

          {!activeSubscription ? (
            <Button
              size="lg"
              className="w-full"
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending || !isOwner}
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now - ${monthlyAmount.toFixed(2)}/month
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => billingPortalMutation.mutate()}
                disabled={billingPortalMutation.isPending}
              >
                {billingPortalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Billing
                  </>
                )}
              </Button>

              {activeSubscription.cancelAtPeriodEnd ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => restoreMutation.mutate(activeSubscription.id)}
                  disabled={restoreMutation.isPending || !isOwner}
                >
                  {restoreMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    "Restore Subscription"
                  )}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => cancelMutation.mutate(activeSubscription.id)}
                  disabled={cancelMutation.isPending || !isOwner}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              )}
            </div>
          )}

          {!isOwner && !activeSubscription && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only organization owners can create subscriptions.
              </AlertDescription>
            </Alert>
          )}

          {activeSubscription?.cancelAtPeriodEnd && (
            <Alert>
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

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>View your subscription history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">Arc Logs Pro</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.seats || 1} {sub.seats === 1 ? "member" : "members"}
                    </p>
                    {sub.periodStart && (
                      <p className="text-xs text-muted-foreground">
                        Started:{" "}
                        {new Date(sub.periodStart).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {getStatusBadge(sub.status)}
                    {sub.cancelAtPeriodEnd && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ends: {new Date(sub.periodEnd).toLocaleDateString()}
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
