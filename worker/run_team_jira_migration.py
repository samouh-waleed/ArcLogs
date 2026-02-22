#!/usr/bin/env python3
"""Run migration to add team Jira override columns"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment")
    exit(1)

# Read migration file
with open("migrations/005_add_team_jira_overrides.sql", "r") as f:
    migration_sql = f.read()

print("🔄 Running migration: Add team Jira overrides...")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Execute migration
    cursor.execute(migration_sql)
    conn.commit()

    print("✅ Migration completed successfully!")
    print("   - Added jira_project_key column to team table")
    print("   - Added jira_board_id column to team table")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Migration failed: {e}")
    exit(1)
