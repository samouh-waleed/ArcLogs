// app/(auth)/create-organization/page.tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CreateOrganizationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <CreateOrganizationContent />
    </Suspense>
  );
}

function CreateOrganizationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?new=1 means the user intentionally clicked "Create Organization" in the
  // sidebar. Without it, we're here because middleware redirected a user with
  // no active org — in that case we redirect back if they already have orgs.
  const isIntentionalCreate = searchParams.get("new") === "1";

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingOrgs, setCheckingOrgs] = useState(!isIntentionalCreate);

  const { data: session } = authClient.useSession();

  useEffect(() => {
    // If the user deliberately clicked "Create Organization", show the form
    // immediately — don't redirect them back to an existing org.
    if (isIntentionalCreate) return;

    if (!session?.user) {
      setCheckingOrgs(false);
      return;
    }

    async function checkExistingOrganizations() {
      try {
        const { data: orgs } = await authClient.organization.list();

        if (orgs && orgs.length > 0) {
          // Middleware redirect path: user has orgs but no active one set.
          // Restore their active org and send to dashboard.
          await authClient.organization.setActive({
            organizationId: orgs[0].id,
          });
          router.push("/");
          return;
        }

        // No orgs at all — show the create form.
        setCheckingOrgs(false);
      } catch (err) {
        console.error("Error checking organizations:", err);
        setCheckingOrgs(false);
      }
    }

    checkExistingOrganizations();
  }, [session?.user?.id, isIntentionalCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const slug = slugify(name);

      const { data, error: createError } = await authClient.organization.create(
        {
          name: name.trim(),
          slug,
        }
      );

      if (createError) {
        throw new Error(createError.message || "Failed to create organization");
      }

      await authClient.organization.setActive({
        organizationId: data.id,
      });

      // Use a full page reload (not router.push) so that:
      //  1. Better Auth's client-side session/org cache is completely cleared
      //  2. React Query's org list cache is reset
      // This ensures the new org appears immediately in the org switcher.
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  if (checkingOrgs) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Create your organization
          </CardTitle>
          <CardDescription>
            Get started by creating your organization. You'll be able to invite
            team members and create teams after this.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be the name of your organization in ArcLogs
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
