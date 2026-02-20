# debug_sprint.py - Verify sprint issues and active sprint lookup
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from jira_client import JiraClient

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def debug():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    # Get Jira connection
    cur.execute("""
        SELECT * FROM jira_connection
        WHERE is_active = TRUE AND deleted_at IS NULL
        LIMIT 1
    """)
    jc = cur.fetchone()
    if not jc:
        print("No Jira connection found")
        return

    print(f"Jira: {jc['jira_domain']}, Project: {jc['default_project_key']}")

    client = JiraClient(
        domain=jc["jira_domain"],
        email=jc["jira_email"],
        api_token=jc["jira_api_token"],
    )

    # Test 1: Get sprint issues via JQL
    print("\n--- Sprint Issues (JQL) ---")
    issues = client.get_sprint_issues(jc["default_project_key"])
    for i in issues:
        print(f"  {i['key']}: {i['summary']} ({i['status']}) - {i['assignee']}")

    # Test 2: Get active sprint
    print("\n--- Active Sprint ---")
    sprint = client.get_active_sprint(jc["default_project_key"])
    if sprint:
        print(f"  Sprint: {sprint['name']} (id={sprint['id']})")
    else:
        print("  No active sprint found")

    # Test 3: Get team members
    print("\n--- Team Members ---")
    cur.execute("""
        SELECT u.name, tm.slack_user_id
        FROM team_member tm
        JOIN "user" u ON tm.user_id = u.id
        WHERE tm.deleted_at IS NULL AND tm.slack_user_id IS NOT NULL
    """)
    for m in cur.fetchall():
        print(f"  {m['name']} ({m['slack_user_id']})")

    cur.close()
    conn.close()


if __name__ == "__main__":
    debug()
