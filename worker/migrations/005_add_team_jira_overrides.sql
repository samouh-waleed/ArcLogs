-- Add Jira project override fields to team table
-- This allows teams to use different Jira projects while sharing org-level connection

ALTER TABLE team
ADD COLUMN IF NOT EXISTS jira_project_key TEXT,
ADD COLUMN IF NOT EXISTS jira_board_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN team.jira_project_key IS 'Override org-level Jira project key for this team (e.g., SCRUM, TEAM)';
COMMENT ON COLUMN team.jira_board_id IS 'Override org-level Jira board ID for sprint and workflow detection';
