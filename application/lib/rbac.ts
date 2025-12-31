import { db } from "./db";
import { eq, and, isNull, or } from "drizzle-orm";
import { member, teamMember, organization, team } from "../drizzle/schema";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type OrgRole = "owner" | "member";
export type TeamRole = "leader" | "member";

export interface UserOrgContext {
  userId: string;
  organizationId: string;
}

export interface UserTeamContext {
  userId: string;
  teamId: string;
}

export interface UserOrgTeamContext {
  userId: string;
  organizationId: string;
  teamId: string;
}

// ============================================
// CORE PERMISSION CHECKS
// ============================================

/**
 * Check if user is an Org Owner
 */
export async function isOrgOwner(ctx: UserOrgContext): Promise<boolean> {
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, ctx.userId),
      eq(member.organizationId, ctx.organizationId),
      isNull(member.deletedAt)
    ),
  });

  return membership?.role === "owner";
}

/**
 * Check if user is a Team Leader for a specific team
 */
export async function isTeamLeader(ctx: UserTeamContext): Promise<boolean> {
  const membership = await db.query.teamMember.findFirst({
    where: and(
      eq(teamMember.userId, ctx.userId),
      eq(teamMember.teamId, ctx.teamId),
      isNull(teamMember.deletedAt)
    ),
  });

  return membership?.role === "leader";
}

/**
 * Check if user is a Team Member (any role) for a specific team
 */
export async function isTeamMember(ctx: UserTeamContext): Promise<boolean> {
  const membership = await db.query.teamMember.findFirst({
    where: and(
      eq(teamMember.userId, ctx.userId),
      eq(teamMember.teamId, ctx.teamId),
      isNull(teamMember.deletedAt)
    ),
  });

  return membership !== undefined;
}

/**
 * Check if user is a member of the organization (any role)
 */
export async function isOrgMember(ctx: UserOrgContext): Promise<boolean> {
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, ctx.userId),
      eq(member.organizationId, ctx.organizationId),
      isNull(member.deletedAt)
    ),
  });

  return membership !== undefined;
}

/**
 * Get user's role in an organization
 */
export async function getUserOrgRole(
  ctx: UserOrgContext
): Promise<OrgRole | null> {
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, ctx.userId),
      eq(member.organizationId, ctx.organizationId),
      isNull(member.deletedAt)
    ),
  });

  return (membership?.role as OrgRole) || null;
}

/**
 * Get user's role in a team
 */
export async function getUserTeamRole(
  ctx: UserTeamContext
): Promise<TeamRole | null> {
  const membership = await db.query.teamMember.findFirst({
    where: and(
      eq(teamMember.userId, ctx.userId),
      eq(teamMember.teamId, ctx.teamId),
      isNull(teamMember.deletedAt)
    ),
  });

  return (membership?.role as TeamRole) || null;
}

/**
 * Get all teams where user is a leader
 */
export async function getUserLeaderTeams(userId: string): Promise<string[]> {
  const teams = await db.query.teamMember.findMany({
    where: and(
      eq(teamMember.userId, userId),
      eq(teamMember.role, "leader"),
      isNull(teamMember.deletedAt)
    ),
  });

  return teams.map((t) => t.teamId);
}

/**
 * Get all teams where user is a member (any role)
 */
export async function getUserTeams(userId: string): Promise<string[]> {
  const teams = await db.query.teamMember.findMany({
    where: and(eq(teamMember.userId, userId), isNull(teamMember.deletedAt)),
  });

  return teams.map((t) => t.teamId);
}

// ============================================
// ORG OWNER PERMISSIONS
// ============================================

export const OrgOwnerPermissions = {
  /**
   * Create a new team in the organization
   */
  async canCreateTeam(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Delete a team permanently (30-day soft delete)
   */
  async canDeleteTeam(ctx: UserOrgTeamContext): Promise<boolean> {
    return await isOrgOwner({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });
  },

  /**
   * View all teams in the organization
   */
  async canViewAllTeams(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * View all updates from any team
   */
  async canViewAllUpdates(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Assign/remove Team Leaders to any team
   */
  async canManageTeamLeaders(ctx: UserOrgTeamContext): Promise<boolean> {
    return await isOrgOwner({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });
  },

  /**
   * Invite/remove any user from the organization
   */
  async canManageOrgMembers(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Manage billing and subscription
   */
  async canManageBilling(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Configure org-wide settings
   */
  async canManageOrgSettings(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Transfer organization ownership
   */
  async canTransferOwnership(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Delete the entire organization
   */
  async canDeleteOrganization(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Export all org data
   */
  async canExportOrgData(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * View analytics across all teams
   */
  async canViewOrgAnalytics(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgOwner(ctx);
  },

  /**
   * Restore archived/deleted teams
   */
  async canRestoreTeam(ctx: UserOrgTeamContext): Promise<boolean> {
    return await isOrgOwner({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });
  },
};

// ============================================
// TEAM LEADER PERMISSIONS
// ============================================

export const TeamLeaderPermissions = {
  /**
   * Create a new team (if org setting allows)
   */
  async canCreateTeam(ctx: UserOrgContext): Promise<boolean> {
    // First check if user is org owner
    if (await isOrgOwner(ctx)) {
      return true;
    }

    // Then check if org allows team leaders to create teams
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, ctx.organizationId),
    });

    if (!org?.allowTeamLeadersCreateTeams) {
      return false;
    }

    // Check if user is a team leader in any team in this org
    const userTeams = await db.query.teamMember.findMany({
      where: and(
        eq(teamMember.userId, ctx.userId),
        eq(teamMember.role, "leader"),
        isNull(teamMember.deletedAt)
      ),
      with: {
        team: true,
      },
    });

    return userTeams.some(
      (tm) => tm.team.organizationId === ctx.organizationId
    );
  },

  /**
   * Configure team settings (questions, response times, AI settings)
   */
  async canManageTeamSettings(ctx: UserTeamContext): Promise<boolean> {
    // Org owners can always manage team settings
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * Invite/remove Team Members
   */
  async canManageTeamMembers(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * View all updates from team members
   */
  async canViewTeamUpdates(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * View AI insights for the team
   */
  async canViewTeamInsights(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * Archive/unarchive the team (soft delete)
   */
  async canArchiveTeam(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * Edit team name, description
   */
  async canEditTeamDetails(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * Export team data
   */
  async canExportTeamData(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * Assign other Team Leaders (co-leaders)
   */
  async canAssignCoLeaders(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },

  /**
   * See who's not submitting updates
   */
  async canViewComplianceTracking(ctx: UserTeamContext): Promise<boolean> {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (teamData) {
      const isOwner = await isOrgOwner({
        userId: ctx.userId,
        organizationId: teamData.organizationId,
      });
      if (isOwner) return true;
    }

    return await isTeamLeader(ctx);
  },
};

// ============================================
// TEAM MEMBER PERMISSIONS
// ============================================

export const TeamMemberPermissions = {
  /**
   * Submit daily updates (voice or text)
   */
  async canSubmitUpdate(ctx: UserTeamContext): Promise<boolean> {
    return await isTeamMember(ctx);
  },

  /**
   * View own update history
   */
  async canViewOwnUpdates(ctx: UserTeamContext): Promise<boolean> {
    return await isTeamMember(ctx);
  },

  /**
   * Edit own updates (within time window)
   */
  async canEditOwnUpdate(
    ctx: UserTeamContext & { updateCreatedAt: Date }
  ): Promise<boolean> {
    if (!(await isTeamMember(ctx))) {
      return false;
    }

    // Get team settings for edit window
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    if (!teamData) return false;

    const editWindowMs = teamData.updateEditWindowMinutes * 60 * 1000;
    const now = new Date();
    const timeSinceUpdate = now.getTime() - ctx.updateCreatedAt.getTime();

    return timeSinceUpdate <= editWindowMs;
  },

  /**
   * Delete own updates (within time window)
   */
  async canDeleteOwnUpdate(
    ctx: UserTeamContext & { updateCreatedAt: Date }
  ): Promise<boolean> {
    return await TeamMemberPermissions.canEditOwnUpdate(ctx);
  },

  /**
   * View aggregated insights for the team (if team settings allow)
   */
  async canViewTeamInsights(ctx: UserTeamContext): Promise<boolean> {
    if (!(await isTeamMember(ctx))) {
      return false;
    }

    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    return teamData?.membersCanSeeInsights || false;
  },

  /**
   * View other members' updates (if team settings allow)
   */
  async canViewOtherUpdates(ctx: UserTeamContext): Promise<boolean> {
    if (!(await isTeamMember(ctx))) {
      return false;
    }

    const teamData = await db.query.team.findFirst({
      where: eq(team.id, ctx.teamId),
    });

    return teamData?.membersCanSeeUpdates || false;
  },

  /**
   * Request to join additional teams
   */
  async canRequestTeamJoin(ctx: UserOrgContext): Promise<boolean> {
    return await isOrgMember(ctx);
  },

  /**
   * Leave a team voluntarily
   */
  async canLeaveTeam(ctx: UserTeamContext): Promise<boolean> {
    return await isTeamMember(ctx);
  },

  /**
   * Update profile/notification preferences
   */
  async canUpdateProfile(userId: string): Promise<boolean> {
    // All authenticated users can update their own profile
    return true;
  },
};

// ============================================
// COMPOSITE PERMISSION CHECKS
// ============================================

/**
 * Check if user can perform any action on a team
 * (either as Org Owner, Team Leader, or Team Member)
 */
export async function canAccessTeam(ctx: UserTeamContext): Promise<boolean> {
  // Check if org owner
  const teamData = await db.query.team.findFirst({
    where: eq(team.id, ctx.teamId),
  });

  if (teamData) {
    const isOwner = await isOrgOwner({
      userId: ctx.userId,
      organizationId: teamData.organizationId,
    });
    if (isOwner) return true;
  }

  // Check if team member
  return await isTeamMember(ctx);
}

/**
 * Check if user has leadership permissions on a team
 * (either as Org Owner or Team Leader)
 */
export async function hasTeamLeadership(
  ctx: UserTeamContext
): Promise<boolean> {
  const teamData = await db.query.team.findFirst({
    where: eq(team.id, ctx.teamId),
  });

  if (teamData) {
    const isOwner = await isOrgOwner({
      userId: ctx.userId,
      organizationId: teamData.organizationId,
    });
    if (isOwner) return true;
  }

  return await isTeamLeader(ctx);
}

/**
 * Ensure user is the last owner before deletion/transfer
 */
export async function isLastOrgOwner(ctx: UserOrgContext): Promise<boolean> {
  const owners = await db.query.member.findMany({
    where: and(
      eq(member.organizationId, ctx.organizationId),
      eq(member.role, "owner"),
      isNull(member.deletedAt)
    ),
  });

  return owners.length === 1 && owners[0].userId === ctx.userId;
}

/**
 * Ensure user is the last team leader before removal
 */
export async function isLastTeamLeader(ctx: UserTeamContext): Promise<boolean> {
  const leaders = await db.query.teamMember.findMany({
    where: and(
      eq(teamMember.teamId, ctx.teamId),
      eq(teamMember.role, "leader"),
      isNull(teamMember.deletedAt)
    ),
  });

  return leaders.length === 1 && leaders[0].userId === ctx.userId;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get team's organization ID
 */
export async function getTeamOrganizationId(
  teamId: string
): Promise<string | null> {
  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
  });

  return teamData?.organizationId || null;
}

/**
 * Verify team belongs to organization
 */
export async function teamBelongsToOrg(
  teamId: string,
  organizationId: string
): Promise<boolean> {
  const teamData = await db.query.team.findFirst({
    where: and(eq(team.id, teamId), eq(team.organizationId, organizationId)),
  });

  return teamData !== undefined;
}

/**
 * Check if organization is soft-deleted
 */
export async function isOrgDeleted(organizationId: string): Promise<boolean> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });

  return org?.deletedAt !== null;
}

/**
 * Check if team is soft-deleted or archived
 */
export async function isTeamDeletedOrArchived(teamId: string): Promise<{
  deleted: boolean;
  archived: boolean;
}> {
  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
  });

  return {
    deleted: teamData?.deletedAt !== null,
    archived: teamData?.archivedAt !== null,
  };
}

// ============================================
// PERMISSION ERROR HELPERS
// ============================================

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

export function assertPermission(
  hasPermission: boolean,
  message: string = "Permission denied"
): void {
  if (!hasPermission) {
    throw new PermissionError(message);
  }
}

export async function assertOrgOwner(ctx: UserOrgContext): Promise<void> {
  const hasPermission = await isOrgOwner(ctx);
  assertPermission(hasPermission, "Must be organization owner");
}

export async function assertTeamLeader(ctx: UserTeamContext): Promise<void> {
  const hasPermission = await hasTeamLeadership(ctx);
  assertPermission(hasPermission, "Must be team leader or organization owner");
}

export async function assertTeamMember(ctx: UserTeamContext): Promise<void> {
  const hasPermission = await canAccessTeam(ctx);
  assertPermission(
    hasPermission,
    "Must be team member, team leader, or organization owner"
  );
}
