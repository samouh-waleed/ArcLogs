import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import httpx
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 80)
print("TESTING FRONTEND TEST CONNECTION FLOW")
print("=" * 80)

# Get credentials from database
conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT jira_domain, jira_email, jira_api_token
    FROM jira_connection
    WHERE deleted_at IS NULL AND is_active = TRUE
    LIMIT 1
""")

jira_conn = cur.fetchone()
cur.close()
conn.close()

if not jira_conn:
    print("❌ No Jira connection found!")
    exit(1)

domain = jira_conn["jira_domain"]
email = jira_conn["jira_email"]
api_token = jira_conn["jira_api_token"]

print(f"\n✓ Domain: {domain}")
print(f"✓ Email: {email}")
print(f"✓ API Token: {api_token[:15]}...")
print()

# Test 1: Direct Jira API call (like Python worker does)
print("=" * 80)
print("TEST 1: Direct Jira API call (Python/Worker style)")
print("=" * 80)

try:
    response = httpx.get(
        f"https://{domain}/rest/api/3/myself",
        auth=(email, api_token),
        headers={"Accept": "application/json"},
        timeout=10.0
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success - Authenticated as: {data.get('displayName')}")
    else:
        print(f"❌ Failed: {response.text}")
except Exception as e:
    print(f"❌ Exception: {e}")

print()

# Test 2: Test connection like Next.js API does
print("=" * 80)
print("TEST 2: Next.js API style (Basic Auth)")
print("=" * 80)

try:
    import base64

    # This is what the Next.js API route does
    auth_string = f"{email}:{api_token}"
    auth_bytes = auth_string.encode('utf-8')
    auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')

    print(f"Auth header: Basic {auth_b64[:20]}...")
    print()

    response = httpx.get(
        f"https://{domain}/rest/api/3/myself",
        headers={
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json",
        },
        timeout=10.0
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success - Authenticated as: {data.get('displayName')}")
    else:
        print(f"❌ Failed: {response.text}")
except Exception as e:
    print(f"❌ Exception: {e}")

print()

# Test 3: Call the actual Next.js API endpoint
print("=" * 80)
print("TEST 3: Call Next.js /api/jira/test-connection endpoint")
print("=" * 80)

try:
    response = httpx.post(
        "http://localhost:3000/api/jira/test-connection",
        headers={"Content-Type": "application/json"},
        json={
            "jiraDomain": domain,
            "jiraEmail": email,
            "jiraApiToken": api_token,
        },
        timeout=10.0
    )

    print(f"Status: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))

except httpx.ConnectError as e:
    print(f"❌ Connection error (is Next.js running on localhost:3000?): {e}")
except Exception as e:
    print(f"❌ Exception: {e}")

print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
print("If Test 1 & 2 pass but Test 3 fails:")
print("  → Check Next.js logs for errors")
print("  → Check if API route has authentication issues")
print("  → Check if fetch() in Next.js has different behavior")
print("=" * 80)
