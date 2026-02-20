import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 80)
print("CLEANING UP ERROR JIRA LINKS")
print("=" * 80)

conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur = conn.cursor()

try:
    # Find ERROR records
    cur.execute("""
        SELECT
            id,
            standup_response_id,
            jira_issue_key,
            action_type,
            error_message,
            created_at
        FROM jira_link
        WHERE jira_issue_key = 'ERROR'
        ORDER BY created_at DESC
    """)

    error_links = cur.fetchall()

    if error_links:
        print(f"\n✓ Found {len(error_links)} ERROR record(s):\n")
        for link in error_links:
            print(f"  ID: {link['id']}")
            print(f"  Response ID: {link['standup_response_id']}")
            print(f"  Action: {link['action_type']}")
            print(f"  Error: {link['error_message']}")
            print(f"  Created: {link['created_at']}")
            print()

        confirm = input("Delete these ERROR records? (yes/no): ").strip().lower()

        if confirm == "yes":
            cur.execute("""
                DELETE FROM jira_link
                WHERE jira_issue_key = 'ERROR'
            """)

            deleted_count = cur.rowcount
            conn.commit()

            print(f"\n✅ Deleted {deleted_count} ERROR record(s)")
            print("\n🔄 You can now retry the standup - it will attempt to create the Jira ticket again")
        else:
            print("\n❌ Cancelled - no records deleted")
    else:
        print("\n✅ No ERROR records found - database is clean!")

except Exception as e:
    print(f"\n❌ Error: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()

print("=" * 80)
