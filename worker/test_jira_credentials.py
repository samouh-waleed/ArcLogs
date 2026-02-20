import os
import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 80)
print("TESTING JIRA CREDENTIALS")
print("=" * 80)

# Get credentials from database
conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT
        jira_domain,
        jira_email,
        jira_api_token
    FROM jira_connection
    WHERE deleted_at IS NULL AND is_active = TRUE
    LIMIT 1
""")

jira_conn = cur.fetchone()

if not jira_conn:
    print("❌ No active Jira connection found in database!")
    exit(1)

domain = jira_conn["jira_domain"]
email = jira_conn["jira_email"]
api_token = jira_conn["jira_api_token"]

print(f"\n✓ Domain: {domain}")
print(f"✓ Email: {email}")
print(f"✓ API Token: {api_token[:10]}...{api_token[-10:] if len(api_token) > 20 else ''}")
print()

# Test 1: Call /myself endpoint
print("=" * 80)
print("TEST 1: Calling /rest/api/3/myself")
print("=" * 80)

try:
    response = httpx.get(
        f"https://{domain}/rest/api/3/myself",
        auth=(email, api_token),
        headers={"Accept": "application/json"},
        timeout=10.0
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print()

    if response.status_code == 200:
        data = response.json()
        print("✅ Connection successful!")
        print(f"   Display Name: {data.get('displayName')}")
        print(f"   Email: {data.get('emailAddress')}")
        print(f"   Account ID: {data.get('accountId')}")
    else:
        print(f"❌ Failed with status {response.status_code}")
        print(f"Response Body:")
        print(response.text)

except Exception as e:
    print(f"❌ Exception occurred: {e}")

print()

# Test 2: Fetch project info
print("=" * 80)
print("TEST 2: Fetching project SCRUM info")
print("=" * 80)

try:
    response = httpx.get(
        f"https://{domain}/rest/api/3/project/SCRUM",
        auth=(email, api_token),
        headers={"Accept": "application/json"},
        timeout=10.0
    )

    print(f"Status Code: {response.status_code}")
    print()

    if response.status_code == 200:
        data = response.json()
        print("✅ Project found!")
        print(f"   Project Name: {data.get('name')}")
        print(f"   Project Key: {data.get('key')}")
        print(f"   Project ID: {data.get('id')}")
        print()

        # Show available issue types
        if "issueTypes" in data:
            print("   Available Issue Types:")
            for issue_type in data["issueTypes"]:
                print(f"     - {issue_type['name']} (ID: {issue_type['id']})")
    else:
        print(f"❌ Failed with status {response.status_code}")
        print(f"Response Body:")
        print(response.text)

except Exception as e:
    print(f"❌ Exception occurred: {e}")

print()

# Test 3: Try to create a test issue
print("=" * 80)
print("TEST 3: Creating a test issue")
print("=" * 80)

try:
    issue_data = {
        "fields": {
            "project": {
                "key": "SCRUM"
            },
            "summary": "[TEST] ArcLogs Jira Integration Test - Please Delete",
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "This is a test ticket created by ArcLogs to verify the Jira integration is working. You can safely delete this ticket."
                            }
                        ]
                    }
                ]
            },
            "issuetype": {
                "name": "Task"
            },
            "labels": ["arclogs-test", "delete-me"]
        }
    }

    print(f"Request Body:")
    print(json.dumps(issue_data, indent=2))
    print()

    response = httpx.post(
        f"https://{domain}/rest/api/3/issue",
        auth=(email, api_token),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        json=issue_data,
        timeout=10.0
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response Body:")
    print(response.text)
    print()

    if response.status_code in [200, 201]:
        data = response.json()
        print("✅ Test issue created successfully!")
        print(f"   Issue Key: {data.get('key')}")
        print(f"   Issue URL: https://{domain}/browse/{data.get('key')}")
        print()
        print(f"⚠️  Please delete this test ticket from Jira: {data.get('key')}")
    else:
        print(f"❌ Failed to create issue")
        print(f"This is the actual error the worker is encountering!")

except Exception as e:
    print(f"❌ Exception occurred: {e}")

print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
print("If Test 1 passed: Your credentials are correct")
print("If Test 2 passed: Your project key (SCRUM) is valid")
print("If Test 3 failed: There's an issue with the issue creation request")
print("=" * 80)

cur.close()
conn.close()
