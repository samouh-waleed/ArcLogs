"""Run SQL migrations against the database."""
import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


def run_migrations():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not set")
        return

    conn = psycopg2.connect(database_url)
    conn.autocommit = True  # Extensions require autocommit
    cur = conn.cursor()

    migrations_dir = Path(__file__).parent
    for sql_file in sorted(migrations_dir.glob("*.sql")):
        print(f"Running migration: {sql_file.name}")
        try:
            cur.execute(sql_file.read_text())
            print(f"  ✅ {sql_file.name} completed")
        except Exception as e:
            print(f"  ⚠️ {sql_file.name} error: {e}")

    cur.close()
    conn.close()
    print("\nMigrations complete.")


if __name__ == "__main__":
    run_migrations()
