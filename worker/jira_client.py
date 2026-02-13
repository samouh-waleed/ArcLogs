# worker/jira_client.py
"""
Jira REST API v3 Client
Handles ticket creation, updates, and comments
"""

import httpx
from typing import Dict, List, Optional, Any
import json


class JiraClient:
    """Client for Jira REST API v3"""

    def __init__(self, domain: str, email: str, api_token: str):
        """
        Initialize Jira client

        Args:
            domain: Jira domain (e.g., "company.atlassian.net")
            email: User email for authentication
            api_token: API token for authentication
        """
        self.domain = domain.rstrip("/")
        self.base_url = f"https://{self.domain}/rest/api/3"
        self.auth = (email, api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def create_issue(
        self,
        project_key: str,
        summary: str,
        description: str,
        issue_type: str = "Task",
        priority: Optional[str] = None,
        assignee_account_id: Optional[str] = None,
        labels: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new Jira issue

        Args:
            project_key: Project key (e.g., "PROJ")
            summary: Issue title
            description: Issue description (supports Jira markdown)
            issue_type: Issue type (Bug, Story, Task, Blocker)
            priority: Priority name (Highest, High, Medium, Low, Lowest)
            assignee_account_id: Jira account ID of assignee
            labels: List of labels to add

        Returns:
            Created issue details with key, id, and self URL

        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        fields = {
            "project": {"key": project_key},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": description}],
                    }
                ],
            },
            "issuetype": {"name": issue_type},
        }

        # Add optional fields
        if priority:
            fields["priority"] = {"name": priority}

        if assignee_account_id:
            fields["assignee"] = {"accountId": assignee_account_id}

        if labels:
            fields["labels"] = labels

        payload = {"fields": fields}

        try:
            response = httpx.post(
                f"{self.base_url}/issue",
                auth=self.auth,
                headers=self.headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

            print(f"✅ Created Jira issue: {data.get('key')}")

            return {
                "key": data["key"],
                "id": data["id"],
                "self": data["self"],
                "url": f"https://{self.domain}/browse/{data['key']}",
            }

        except httpx.HTTPStatusError as e:
            print(f"❌ Jira API error creating issue: {e.response.status_code}")
            print(f"Response: {e.response.text}")
            raise
        except Exception as e:
            print(f"❌ Unexpected error creating Jira issue: {e}")
            raise

    def update_issue(
        self,
        issue_key: str,
        summary: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        assignee_account_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Update an existing Jira issue

        Args:
            issue_key: Issue key (e.g., "PROJ-123")
            summary: New title
            description: New description
            priority: New priority
            assignee_account_id: New assignee
            status: New status (e.g., "In Progress", "Done")

        Returns:
            Update confirmation with issue key

        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        fields = {}

        if summary:
            fields["summary"] = summary

        if description:
            fields["description"] = {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": description}],
                    }
                ],
            }

        if priority:
            fields["priority"] = {"name": priority}

        if assignee_account_id:
            fields["assignee"] = {"accountId": assignee_account_id}

        if not fields and not status:
            print("⚠️ No fields to update")
            return {"key": issue_key, "updated": False}

        try:
            # Update fields
            if fields:
                response = httpx.put(
                    f"{self.base_url}/issue/{issue_key}",
                    auth=self.auth,
                    headers=self.headers,
                    json={"fields": fields},
                    timeout=30.0,
                )
                response.raise_for_status()

            # Update status if provided (requires transition)
            if status:
                self._transition_issue(issue_key, status)

            print(f"✅ Updated Jira issue: {issue_key}")

            return {
                "key": issue_key,
                "updated": True,
                "url": f"https://{self.domain}/browse/{issue_key}",
            }

        except httpx.HTTPStatusError as e:
            print(f"❌ Jira API error updating {issue_key}: {e.response.status_code}")
            print(f"Response: {e.response.text}")
            raise
        except Exception as e:
            print(f"❌ Unexpected error updating Jira issue: {e}")
            raise

    def add_comment(
        self, issue_key: str, comment: str, visibility: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add a comment to a Jira issue

        Args:
            issue_key: Issue key (e.g., "PROJ-123")
            comment: Comment text
            visibility: Optional visibility restriction

        Returns:
            Created comment details

        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        payload = {
            "body": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": comment}],
                    }
                ],
            }
        }

        if visibility:
            payload["visibility"] = {"type": "role", "value": visibility}

        try:
            response = httpx.post(
                f"{self.base_url}/issue/{issue_key}/comment",
                auth=self.auth,
                headers=self.headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

            print(f"✅ Added comment to {issue_key}")

            return {
                "id": data["id"],
                "issue_key": issue_key,
                "url": f"https://{self.domain}/browse/{issue_key}",
            }

        except httpx.HTTPStatusError as e:
            print(
                f"❌ Jira API error adding comment to {issue_key}: {e.response.status_code}"
            )
            print(f"Response: {e.response.text}")
            raise
        except Exception as e:
            print(f"❌ Unexpected error adding comment: {e}")
            raise

    def get_issue(self, issue_key: str) -> Dict[str, Any]:
        """
        Get issue details

        Args:
            issue_key: Issue key (e.g., "PROJ-123")

        Returns:
            Issue details

        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        try:
            response = httpx.get(
                f"{self.base_url}/issue/{issue_key}",
                auth=self.auth,
                headers=self.headers,
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                print(f"⚠️ Issue {issue_key} not found")
            else:
                print(f"❌ Jira API error getting {issue_key}: {e.response.status_code}")
            raise
        except Exception as e:
            print(f"❌ Unexpected error getting Jira issue: {e}")
            raise

    def get_board_columns(self, project_key: str) -> List[str]:
        """
        Get the ordered board column names for a project.
        Returns the actual workflow columns (e.g., ["To Do", "In Progress", "In Review", "Done"]).
        Each team may have different columns.
        """
        agile_url = f"https://{self.domain}/rest/agile/1.0"

        try:
            # Find board for this project
            response = httpx.get(
                f"{agile_url}/board",
                auth=self.auth,
                headers=self.headers,
                params={"projectKeyOrId": project_key},
                timeout=15.0,
            )
            response.raise_for_status()
            boards = response.json().get("values", [])
            if not boards:
                return []

            board_id = boards[0]["id"]

            # Get board configuration (contains column order)
            response = httpx.get(
                f"{agile_url}/board/{board_id}/configuration",
                auth=self.auth,
                headers=self.headers,
                timeout=15.0,
            )
            response.raise_for_status()
            config = response.json()

            columns = []
            for col in config.get("columnConfig", {}).get("columns", []):
                name = col.get("name", "")
                if name:
                    columns.append(name)

            print(f"✅ Board columns: {' → '.join(columns)}")
            return columns

        except Exception as e:
            print(f"⚠️ Could not get board columns for {project_key}: {e}")
            return []

    @staticmethod
    def _parse_issues(raw_issues: List[Dict]) -> List[Dict[str, str]]:
        """Safely parse Jira issue list, handling null fields."""
        issues = []
        for issue in raw_issues:
            if not issue:
                continue
            fields = issue.get("fields") or {}
            issues.append({
                "key": issue.get("key", ""),
                "summary": fields.get("summary") or "",
                "status": (fields.get("status") or {}).get("name", ""),
                "assignee": (fields.get("assignee") or {}).get("displayName", "Unassigned"),
                "type": (fields.get("issuetype") or {}).get("name", ""),
                "priority": (fields.get("priority") or {}).get("name", ""),
            })
        return issues

    def _jql_search(self, jql: str, fields: str = "summary,status,assignee,issuetype,priority", max_results: int = 50) -> List[Dict]:
        """Run a JQL search using the current Jira Cloud API (/search/jql)."""
        response = httpx.get(
            f"{self.base_url}/search/jql",
            auth=self.auth,
            headers=self.headers,
            params={
                "jql": jql,
                "fields": fields,
                "maxResults": max_results,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json().get("issues", [])

    def get_sprint_issues(self, project_key: str) -> List[Dict[str, Any]]:
        """
        Get all issues in the active sprint using JQL search.
        Uses GET method (current Jira Cloud API, POST was deprecated).

        Returns:
            List of issues with key, summary, status, assignee, type, priority
        """
        try:
            jql = f'project = "{project_key}" AND sprint in openSprints() ORDER BY rank'
            raw_issues = self._jql_search(jql)

            issues = self._parse_issues(raw_issues)
            print(f"✅ Found {len(issues)} issues in active sprint via JQL")

            # Fallback: if no sprint issues, get recent non-Done project issues
            if not issues:
                print("⚠️ No sprint issues found, fetching recent project issues as fallback")
                jql_fallback = f'project = "{project_key}" AND status != Done ORDER BY updated DESC'
                raw_issues = self._jql_search(jql_fallback, max_results=30)
                issues = self._parse_issues(raw_issues)
                print(f"✅ Found {len(issues)} project issues as fallback")

            return issues

        except Exception as e:
            print(f"⚠️ Could not get sprint issues for {project_key}: {e}")
            return []

    def transition_issue(self, issue_key: str, target_status: str) -> bool:
        """
        Transition issue to target status. Handles fuzzy matching of status names
        and picks the next logical transition if exact match not found.

        Returns:
            True if transition was successful
        """
        try:
            # Get available transitions
            response = httpx.get(
                f"{self.base_url}/issue/{issue_key}/transitions",
                auth=self.auth,
                headers=self.headers,
                timeout=30.0,
            )
            response.raise_for_status()
            transitions = response.json()["transitions"]

            if not transitions:
                print(f"⚠️ No transitions available for {issue_key}")
                return False

            # Status name aliases for fuzzy matching
            status_aliases = {
                "in_progress": ["in progress", "start progress", "begin work"],
                "done": ["done", "complete", "resolve", "closed"],
                "in_review": ["in review", "review", "code review", "peer review"],
                "to_do": ["to do", "open", "backlog", "new"],
            }

            target_lower = target_status.lower().replace("_", " ")

            # Try exact match first
            transition_id = None
            for t in transitions:
                t_name = t["to"]["name"].lower() if "to" in t else t["name"].lower()
                if t_name == target_lower:
                    transition_id = t["id"]
                    break

            # Try alias match
            if not transition_id:
                target_aliases = status_aliases.get(target_status, [target_lower])
                for t in transitions:
                    t_name = t["to"]["name"].lower() if "to" in t else t["name"].lower()
                    for alias in target_aliases:
                        if alias in t_name or t_name in alias:
                            transition_id = t["id"]
                            break
                    if transition_id:
                        break

            if not transition_id:
                available = [f"{t.get('to', {}).get('name', t['name'])}" for t in transitions]
                print(f"⚠️ No matching transition for '{target_status}' on {issue_key}. Available: {available}")
                return False

            # Execute transition
            response = httpx.post(
                f"{self.base_url}/issue/{issue_key}/transitions",
                auth=self.auth,
                headers=self.headers,
                json={"transition": {"id": transition_id}},
                timeout=30.0,
            )
            response.raise_for_status()
            print(f"✅ Transitioned {issue_key} → {target_status}")
            return True

        except Exception as e:
            print(f"⚠️ Could not transition {issue_key}: {e}")
            return False

    def _transition_issue(self, issue_key: str, status_name: str):
        """
        Transition issue to new status

        Args:
            issue_key: Issue key
            status_name: Target status name

        Note: This requires finding the transition ID first
        """
        try:
            # Get available transitions
            response = httpx.get(
                f"{self.base_url}/issue/{issue_key}/transitions",
                auth=self.auth,
                headers=self.headers,
                timeout=30.0,
            )
            response.raise_for_status()
            transitions = response.json()["transitions"]

            # Find matching transition
            transition_id = None
            for t in transitions:
                if t["name"].lower() == status_name.lower():
                    transition_id = t["id"]
                    break

            if not transition_id:
                print(
                    f"⚠️ Status '{status_name}' not available for {issue_key}. Available: {[t['name'] for t in transitions]}"
                )
                return

            # Execute transition
            response = httpx.post(
                f"{self.base_url}/issue/{issue_key}/transitions",
                auth=self.auth,
                headers=self.headers,
                json={"transition": {"id": transition_id}},
                timeout=30.0,
            )
            response.raise_for_status()

            print(f"✅ Transitioned {issue_key} to {status_name}")

        except Exception as e:
            print(f"⚠️ Could not transition {issue_key}: {e}")

    def search_user_by_email(self, email: str) -> Optional[str]:
        """
        Search for Jira user by email to get account ID

        Args:
            email: User email

        Returns:
            Account ID if found, None otherwise
        """
        try:
            response = httpx.get(
                f"{self.base_url}/user/search",
                auth=self.auth,
                headers=self.headers,
                params={"query": email},
                timeout=30.0,
            )
            response.raise_for_status()
            users = response.json()

            if users and len(users) > 0:
                return users[0]["accountId"]

            return None

        except Exception as e:
            print(f"⚠️ Could not search for user {email}: {e}")
            return None

    def get_active_sprint(self, project_key: str) -> Optional[Dict[str, Any]]:
        """
        Get the active sprint for a project.
        Tries Agile API first (no board type filter), falls back to JQL.

        Returns:
            Active sprint dict with id, name, state, or None if no active sprint
        """
        agile_url = f"https://{self.domain}/rest/agile/1.0"

        try:
            # Step 1: Find any board for this project (no type filter)
            response = httpx.get(
                f"{agile_url}/board",
                auth=self.auth,
                headers=self.headers,
                params={"projectKeyOrId": project_key},
                timeout=15.0,
            )
            response.raise_for_status()
            boards = response.json().get("values", [])

            if not boards:
                print(f"⚠️ No board found for {project_key}")
                return None

            # Try each board until we find one with an active sprint
            for board in boards:
                board_id = board["id"]
                try:
                    response = httpx.get(
                        f"{agile_url}/board/{board_id}/sprint",
                        auth=self.auth,
                        headers=self.headers,
                        params={"state": "active"},
                        timeout=15.0,
                    )
                    response.raise_for_status()
                    sprints = response.json().get("values", [])

                    if sprints:
                        sprint = sprints[0]
                        print(f"✅ Found active sprint: {sprint['name']} (id={sprint['id']}, board={board_id})")
                        return sprint
                except Exception:
                    continue

            print(f"⚠️ No active sprint found across {len(boards)} boards for {project_key}")
            return None

        except Exception as e:
            print(f"⚠️ Could not get active sprint for {project_key}: {e}")
            return None

    def move_to_sprint(self, sprint_id: int, issue_key: str) -> bool:
        """
        Move an issue to a sprint via the Jira Agile API.

        Returns:
            True if successful
        """
        agile_url = f"https://{self.domain}/rest/agile/1.0"

        try:
            response = httpx.post(
                f"{agile_url}/sprint/{sprint_id}/issue",
                auth=self.auth,
                headers=self.headers,
                json={"issues": [issue_key]},
                timeout=15.0,
            )
            response.raise_for_status()
            print(f"✅ Moved {issue_key} to sprint {sprint_id}")
            return True

        except Exception as e:
            print(f"⚠️ Could not move {issue_key} to sprint: {e}")
            return False

    def test_connection(self) -> bool:
        """
        Test Jira connection

        Returns:
            True if connection successful, False otherwise
        """
        try:
            response = httpx.get(
                f"{self.base_url}/myself",
                auth=self.auth,
                headers=self.headers,
                timeout=10.0,
            )
            response.raise_for_status()
            user = response.json()
            print(f"✅ Jira connection successful: {user.get('displayName')}")
            return True

        except httpx.HTTPStatusError as e:
            print(f"❌ Jira connection failed: {e.response.status_code}")
            return False
        except Exception as e:
            print(f"❌ Jira connection error: {e}")
            return False
