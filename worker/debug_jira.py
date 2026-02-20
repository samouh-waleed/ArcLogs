import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur = conn.cursor()

print("=" * 80)
print("JIRA CONNECTION CHECK")
print("=" * 80)

# Check jira_connection table
cur.execute("""
    SELECT
        id,
        organization_id,
        jira_domain,
        jira_email,
        default_project_key,
        default_issue_type,
        is_active,
        deleted_at
    FROM jira_connection
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 5
""")

connections = cur.fetchall()

if connections:
    print(f"\n✅ Found {len(connections)} Jira connection(s):\n")
    for conn_data in connections:
        print(f"  ID: {conn_data['id']}")
        print(f"  Org ID: {conn_data['organization_id']}")
        print(f"  Domain: {conn_data['jira_domain']}")
        print(f"  Email: {conn_data['jira_email']}")
        print(f"  Project: {conn_data['default_project_key']}")
        print(f"  Issue Type: {conn_data['default_issue_type']}")
        print(f"  Active: {conn_data['is_active']}")
        print(f"  Deleted: {conn_data['deleted_at']}")
        print()
else:
    print("\n❌ No Jira connections found!\n")

# Check recent standup_response with AI insights
print("=" * 80)
print("RECENT STANDUP RESPONSES")
print("=" * 80)

cur.execute("""
    SELECT
        id,
        user_id,
        team_id,
        ai_insights,
        processing_status,
        created_at
    FROM standup_response
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 3
""")

responses = cur.fetchall()

if responses:
    print(f"\n✅ Found {len(responses)} recent response(s):\n")
    for resp in responses:
        print(f"  Response ID: {resp['id']}")
        print(f"  Status: {resp['processing_status']}")
        print(f"  Created: {resp['created_at']}")

        if resp['ai_insights']:
            insights = resp['ai_insights']
            print(f"  Jira Intent: {insights.get('jira_intent', 'NOT SET')}")
            print(f"  Jira Keys: {insights.get('referenced_jira_keys', 'NOT SET')}")
            print(f"  Jira Suggestions: {'Yes' if insights.get('jira_suggestions') else 'No'}")
        else:
            print(f"  AI Insights: Not processed yet")
        print()
else:
    print("\n❌ No responses found!\n")

# Check jira_link table
print("=" * 80)
print("JIRA LINKS")
print("=" * 80)

cur.execute("""
    SELECT
        id,
        standup_response_id,
        jira_issue_key,
        action_type,
        synced_at,
        error_message
    FROM jira_link
    ORDER BY created_at DESC
    LIMIT 10
""")

links = cur.fetchall()

if links:
    print(f"\n✅ Found {len(links)} Jira link(s):\n")
    for link in links:
        print(f"  Link ID: {link['id']}")
        print(f"  Response ID: {link['standup_response_id']}")
        print(f"  Jira Key: {link['jira_issue_key']}")
        print(f"  Action: {link['action_type']}")
        print(f"  Synced: {link['synced_at']}")
        print(f"  Error: {link['error_message']}")
        print()
else:
    print("\n❌ No Jira links found (no tickets created yet)\n")

cur.close()
conn.close()

print("=" * 80)
