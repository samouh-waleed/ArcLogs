import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Get project key from user
print("=" * 80)
print("UPDATE JIRA PROJECT KEY")
print("=" * 80)
print("\nWhat is your Jira project key?")
print("(This is the prefix in your Jira tickets, e.g., 'SCRUM' for SCRUM-1, SCRUM-2)")
print("\nExamples:")
print("  - SCRUM (for tickets like SCRUM-123)")
print("  - WS (for tickets like WS-456)")
print("  - PROJ (for tickets like PROJ-789)")
print()

project_key = input("Enter your project key: ").strip().upper()

if not project_key:
    print("❌ Project key cannot be empty!")
    exit(1)

if len(project_key) < 2 or len(project_key) > 10:
    print("❌ Project key must be 2-10 characters!")
    exit(1)

print(f"\n✅ Using project key: {project_key}")
print(f"\n⚠️  This will update ALL Jira connections in the database to use '{project_key}'")

confirm = input("\nProceed? (yes/no): ").strip().lower()

if confirm != "yes":
    print("❌ Cancelled")
    exit(0)

# Update database
conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur = conn.cursor()

try:
    # Update all active Jira connections
    cur.execute("""
        UPDATE jira_connection
        SET
            default_project_key = %s,
            updated_at = NOW()
        WHERE deleted_at IS NULL
        RETURNING id, organization_id, jira_domain, default_project_key
    """, (project_key,))

    updated = cur.fetchall()
    conn.commit()

    if updated:
        print(f"\n✅ Successfully updated {len(updated)} Jira connection(s):\n")
        for conn_data in updated:
            print(f"  ID: {conn_data['id']}")
            print(f"  Org: {conn_data['organization_id']}")
            print(f"  Domain: {conn_data['jira_domain']}")
            print(f"  Project Key: {conn_data['default_project_key']}")
            print()
    else:
        print("\n❌ No Jira connections found to update!")

except Exception as e:
    print(f"\n❌ Error updating database: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()

print("=" * 80)
print("NEXT STEPS:")
print("=" * 80)
print("1. Test your standup again via Slack")
print("2. Check the worker logs for Jira sync messages")
print("3. Verify the ticket was created in Jira")
print(f"4. Expected Jira ticket key format: {project_key}-###")
print("=" * 80)
