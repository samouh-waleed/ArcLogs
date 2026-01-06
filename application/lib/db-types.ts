// lib/db-types.ts
import type { InferSelectModel } from "drizzle-orm";
import * as schema from "@/drizzle/schema";

export type User = InferSelectModel<typeof schema.user>;
export type Team = InferSelectModel<typeof schema.team>;
export type TeamMember = InferSelectModel<typeof schema.teamMember>;
export type Organization = InferSelectModel<typeof schema.organization>;
export type StandupConfig = InferSelectModel<typeof schema.standupConfig>;

export type TeamMemberWithUser = TeamMember & {
  user: User;
};

export type TeamMemberWithRelations = TeamMember & {
  user: User;
  team: Team & {
    standupConfigs: StandupConfig[];
  };
};

export type ConfigWithFullData = StandupConfig & {
  team: Team & {
    organization: Organization;
    teamMembers: TeamMemberWithUser[];
  };
};

export type StandupConfigWithTeam = StandupConfig & {
  team: Team & {
    organization: Organization;
  };
};
