-- Backfill: soft-delete all child records of already-deleted teams
-- Run this against Neon after deploying the cascade code.
-- Each UPDATE uses the parent team's deleted_at timestamp for consistency.

BEGIN;

UPDATE team_member
SET deleted_at = t.deleted_at
FROM team t
WHERE team_member.team_id = t.id
  AND t.deleted_at IS NOT NULL
  AND team_member.deleted_at IS NULL;

UPDATE standup_config
SET deleted_at = t.deleted_at
FROM team t
WHERE standup_config.team_id = t.id
  AND t.deleted_at IS NOT NULL
  AND standup_config.deleted_at IS NULL;

UPDATE standup_response
SET deleted_at = t.deleted_at
FROM team t
WHERE standup_response.team_id = t.id
  AND t.deleted_at IS NOT NULL
  AND standup_response.deleted_at IS NULL;

UPDATE insight
SET deleted_at = t.deleted_at
FROM team t
WHERE insight.team_id = t.id
  AND t.deleted_at IS NOT NULL
  AND insight.deleted_at IS NULL;

UPDATE help_request
SET deleted_at = t.deleted_at
FROM team t
WHERE help_request.team_id = t.id
  AND t.deleted_at IS NOT NULL
  AND help_request.deleted_at IS NULL;

-- jira_link is linked through standup_response, not directly to team
UPDATE jira_link
SET deleted_at = sr.deleted_at
FROM standup_response sr
WHERE jira_link.standup_response_id = sr.id
  AND sr.deleted_at IS NOT NULL
  AND jira_link.deleted_at IS NULL;

COMMIT;
