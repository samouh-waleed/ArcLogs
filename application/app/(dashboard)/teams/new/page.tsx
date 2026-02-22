// app/teams/new/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { TeamSetupWizard } from "@/components/team-setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewTeamPage() {
  const router = useRouter();
  const { data: session, isPending: isLoadingSession } =
    authClient.useSession();
  const { data: activeOrg, isPending: isLoadingOrg } =
    authClient.useActiveOrganization();

  // Redirect if not authenticated or no active org
  useEffect(() => {
    if (!isLoadingSession && !isLoadingOrg && (!session || !activeOrg)) {
      router.push("/");
    }
  }, [isLoadingSession, isLoadingOrg, session, activeOrg, router]);

  if (isLoadingSession || isLoadingOrg) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!session || !activeOrg) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Team</h1>
          <p className="text-muted-foreground">
            Follow the guided steps to set up your team
          </p>
        </div>
      </div>

      <TeamSetupWizard organizationId={activeOrg.id} />
    </div>
  );
}
