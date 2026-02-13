# debug_search.py - Test Jira search API endpoints
import os
import httpx
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur = conn.cursor()
cur.execute("SELECT * FROM jira_connection WHERE is_active = TRUE AND deleted_at IS NULL LIMIT 1")
jc = cur.fetchone()
cur.close()
conn.close()

base_url = f"https://{jc['jira_domain']}/rest/api/3"
auth = (jc["jira_email"], jc["jira_api_token"])
headers = {"Accept": "application/json", "Content-Type": "application/json"}
jql = f'project = "{jc["default_project_key"]}" AND sprint in openSprints() ORDER BY rank'

# Test 1: GET /rest/api/3/search
print("--- Test 1: GET /rest/api/3/search ---")
try:
    r = httpx.get(f"{base_url}/search", auth=auth, headers=headers,
                  params={"jql": jql, "fields": "summary,status", "maxResults": 10}, timeout=30)
    print(f"  Status: {r.status_code}")
    print(f"  Response keys: {list(r.json().keys()) if r.status_code == 200 else r.text[:300]}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Total: {data.get('total')}")
        for issue in data.get("issues", [])[:3]:
            print(f"  Issue: {json.dumps(issue, indent=2)[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 2: GET /rest/api/3/search/jql
print("\n--- Test 2: GET /rest/api/3/search/jql ---")
try:
    r = httpx.get(f"{base_url}/search/jql", auth=auth, headers=headers,
                  params={"jql": jql, "fields": "summary,status", "maxResults": 10}, timeout=30)
    print(f"  Status: {r.status_code}")
    print(f"  Response keys: {list(r.json().keys()) if r.status_code == 200 else r.text[:300]}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Total: {data.get('total')}")
        for issue in data.get("issues", [])[:3]:
            print(f"  Issue: {json.dumps(issue, indent=2)[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 3: POST /rest/api/3/search (old, likely 410)
print("\n--- Test 3: POST /rest/api/3/search ---")
try:
    r = httpx.post(f"{base_url}/search", auth=auth, headers=headers,
                   json={"jql": jql, "fields": ["summary", "status"], "maxResults": 10}, timeout=30)
    print(f"  Status: {r.status_code}")
    print(f"  Response: {r.text[:300]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 4: Simpler JQL (no sprint filter)
print("\n--- Test 4: Simple JQL (no sprint) ---")
try:
    simple_jql = f'project = "{jc["default_project_key"]}" ORDER BY updated DESC'
    r = httpx.get(f"{base_url}/search/jql", auth=auth, headers=headers,
                  params={"jql": simple_jql, "fields": "summary,status,assignee", "maxResults": 10}, timeout=30)
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Total: {data.get('total')}")
        for issue in data.get("issues", [])[:5]:
            f = issue.get("fields", {})
            print(f"  {issue['key']}: {f.get('summary')} ({f.get('status',{}).get('name')})")
except Exception as e:
    print(f"  Error: {e}")
