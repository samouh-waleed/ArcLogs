"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  Plus,
  Check,
  ChevronsUpDown,
  LogOut,
  User,
  Building2,
  Crown,
  Menu,
  Sparkles,
  ChartArea,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Configuration & Data Fetching (Same as before) ---
const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Analytics", href: "/analytics", icon: ChartArea },
];

const adminNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

async function fetchTeams() {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Failed to fetch teams");
  return response.json();
}

// --- Sub-components ---

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">
        ArcLogs
      </span>
    </Link>
  );
}

function SidebarContent({
  pathname,
  router,
  session,
  activeOrg,
  organizations,
  myTeams,
  getTeamRole,
  canAccessAdmin,
  switching,
  handleSwitchOrg,
  handleSignOut,
  onLinkClick,
}: any) {
  return (
    <div className="flex h-full w-full flex-col bg-card/50 text-card-foreground">
      {/* Header / Org Switcher */}
      <div className="p-4 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-between gap-2 border-transparent bg-secondary/50 px-3 shadow-none hover:bg-secondary/80 data-[state=open]:bg-secondary"
              disabled={switching}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex flex-col items-start gap-0.5 overflow-hidden text-left">
                  <span className="truncate text-sm font-semibold leading-none">
                    {activeOrg?.name || "Select Org"}
                  </span>
                  <span className="truncate text-[10px] font-medium text-muted-foreground">
                    {activeOrg?.slug || "Organization"}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[220px]" align="start">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch Organization
            </DropdownMenuLabel>
            {organizations?.map((org: any) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className="gap-2 p-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded border bg-background">
                  <span className="text-xs font-bold uppercase">
                    {org.name.charAt(0)}
                  </span>
                </div>
                <span className="flex-1 truncate text-sm">{org.name}</span>
                {org.id === activeOrg?.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2 text-muted-foreground hover:text-primary"
              onClick={() => {
                router.push("/create-organization");
                onLinkClick?.();
              }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-muted-foreground/30">
                <Plus className="h-3.5 w-3.5" />
              </div>
              Create Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/50">
        <nav className="space-y-6">
          <div className="space-y-1">
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Platform
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {canAccessAdmin && (
            <div className="space-y-1">
              <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Admin
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {myTeams.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Your Teams
                </div>
                <Badge
                  variant="outline"
                  className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
                >
                  {myTeams.length}
                </Badge>
              </div>
              <div className="space-y-0.5">
                {myTeams.map((team: any) => {
                  const teamRole = getTeamRole(team);
                  const isTeamPage = pathname.startsWith(`/teams/${team.id}`);

                  return (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      onClick={onLinkClick}
                      className={cn(
                        "group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200",
                        isTeamPage
                          ? "bg-secondary text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={cn(
                            "flex h-2 w-2 shrink-0 rounded-full",
                            isTeamPage ? "bg-primary" : "bg-muted-foreground/40"
                          )}
                        />
                        <span className="truncate">{team.name}</span>
                      </div>
                      {teamRole === "leader" && (
                        <Crown className="h-3 w-3 text-amber-500 opacity-80" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-border/50 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="group flex h-auto w-full items-center justify-start gap-3 rounded-xl p-2 hover:bg-secondary/80"
            >
              <Avatar className="h-9 w-9 border border-border transition-transform group-hover:scale-105">
                <AvatarImage src={session?.user?.image} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                <span className="w-full truncate text-sm font-semibold text-foreground">
                  {session?.user?.name || "User"}
                </span>
                <span className="w-full truncate text-xs text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 mb-2" align="end" side="right">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push("/profile");
                onLinkClick?.();
              }}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  // ... (Queries remain exactly the same as previous) ...
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await authClient.organization.list();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: fullOrg } = useQuery({
    queryKey: ["organization-full", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return null;
      const { data, error } = await authClient.organization.getFullOrganization(
        { query: { organizationId: activeOrg.id } }
      );
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!activeOrg?.id,
  });

  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const allTeams = Array.isArray(teamsData)
    ? teamsData
    : Array.isArray(teamsData?.teams)
    ? teamsData.teams
    : [];
  const myTeams = allTeams.filter((team: any) =>
    team.teamMembers?.some((tm: any) => tm.userId === session?.user?.id)
  );
  const getTeamRole = (team: any) =>
    team.teamMembers?.find((tm: any) => tm.userId === session?.user?.id)?.role;
  const currentUserMember = fullOrg?.members?.find(
    (m: any) => m.userId === session?.user?.id
  );
  const canAccessAdmin =
    currentUserMember?.role === "owner" || currentUserMember?.role === "admin";

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/login") },
    });
  };

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === activeOrg?.id) return;
    setSwitching(true);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSwitching(false);
    }
  };

  const closeMobile = () => setMobileOpen(false);
  const sidebarProps = {
    pathname,
    router,
    session,
    activeOrg,
    organizations,
    fullOrg,
    myTeams,
    getTeamRole,
    canAccessAdmin,
    switching,
    handleSwitchOrg,
    handleSignOut,
  };

  return (
    <>
      {/* Mobile Header - FIXED */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-md">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85%] max-w-[300px] p-0 border-r-0"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center h-16 px-6 border-b">
              <Logo />
            </div>
            <SidebarContent {...sidebarProps} onLinkClick={closeMobile} />
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex justify-center lg:justify-start">
          <Logo />
        </div>
        <div className="w-8" />
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-72 flex-col border-r bg-card shadow-[1px_0_0_0_rgba(0,0,0,0.05)] z-40">
        <div className="flex h-16 items-center px-6 border-b border-border/40">
          <Logo />
        </div>
        <SidebarContent {...sidebarProps} />
      </aside>
    </>
  );
}
