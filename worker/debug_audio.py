# debug_audio.py - Debug Slack audio file download
import os
import io
import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def debug():
    conn = get_db()
    cur = conn.cursor()

    # Get the most recent voice response
    cur.execute("""
        SELECT sr.id, sr.voice_url, sr.slack_user_id, sr.response_type,
               t.organization_id, t.name as team_name
        FROM standup_response sr
        JOIN team t ON sr.team_id = t.id
        WHERE sr.response_type = 'voice' AND sr.deleted_at IS NULL
        ORDER BY sr.created_at DESC
        LIMIT 1
    """)
    response = cur.fetchone()

    if not response:
        print("No voice responses found in DB")
        return

    print(f"Found voice response: {response['id']}")
    print(f"  voice_url: {response['voice_url']}")
    print(f"  org_id: {response['organization_id']}")

    # Get bot token
    cur.execute("""
        SELECT bot_token, slack_team_id
        FROM slack_workspace
        WHERE organization_id = %s AND deleted_at IS NULL
    """, (response["organization_id"],))
    workspace = cur.fetchone()

    if not workspace:
        print("No workspace found!")
        return

    bot_token = workspace["bot_token"]
    print(f"  bot_token: {bot_token[:20]}...")

    voice_url = response["voice_url"]

    # --- Attempt 1: Direct download with follow_redirects ---
    print("\n--- Attempt 1: Direct download (follow_redirects=True) ---")
    try:
        r = httpx.get(
            voice_url,
            headers={"Authorization": f"Bearer {bot_token}"},
            follow_redirects=True,
            timeout=30.0,
        )
        print(f"  Status: {r.status_code}")
        print(f"  Content-Type: {r.headers.get('content-type')}")
        print(f"  Content-Length: {len(r.content)}")
        print(f"  First 200 chars: {r.content[:200]}")
        print(f"  Final URL: {r.url}")
    except Exception as e:
        print(f"  Error: {e}")

    # --- Attempt 2: No redirect, check Location header ---
    print("\n--- Attempt 2: No redirect (check 302 Location) ---")
    try:
        r = httpx.get(
            voice_url,
            headers={"Authorization": f"Bearer {bot_token}"},
            follow_redirects=False,
            timeout=30.0,
        )
        print(f"  Status: {r.status_code}")
        print(f"  Content-Type: {r.headers.get('content-type')}")
        print(f"  Location: {r.headers.get('location', 'N/A')}")
        if r.status_code in (301, 302, 303, 307, 308):
            redirect_url = r.headers.get("location")
            if redirect_url:
                print(f"\n  Following redirect WITHOUT auth header...")
                r2 = httpx.get(redirect_url, follow_redirects=True, timeout=30.0)
                print(f"  Status: {r2.status_code}")
                print(f"  Content-Type: {r2.headers.get('content-type')}")
                print(f"  Content-Length: {len(r2.content)}")
                if not r2.headers.get("content-type", "").startswith("text/html"):
                    print("  SUCCESS! Redirect URL works without auth.")
    except Exception as e:
        print(f"  Error: {e}")

    # --- Attempt 3: Use Slack files.info API to get fresh URL ---
    print("\n--- Attempt 3: Use Slack files.info API ---")
    # Extract file ID from URL if possible
    # Slack URLs look like: https://files.slack.com/files-pri/T.../download/filename
    # Or we can try to get the file from the user's recent files
    try:
        # List recent files for the user
        r = httpx.get(
            "https://slack.com/api/files.list",
            headers={"Authorization": f"Bearer {bot_token}"},
            params={
                "user": response["slack_user_id"],
                "types": "audio",
                "count": 5,
            },
            timeout=30.0,
        )
        data = r.json()
        if data.get("ok") and data.get("files"):
            latest_file = data["files"][0]
            print(f"  File ID: {latest_file['id']}")
            print(f"  Name: {latest_file.get('name')}")
            print(f"  Mimetype: {latest_file.get('mimetype')}")
            print(f"  Size: {latest_file.get('size')}")
            print(f"  url_private: {latest_file.get('url_private', 'N/A')}")
            print(f"  url_private_download: {latest_file.get('url_private_download', 'N/A')}")

            # Try downloading from url_private_download
            dl_url = latest_file.get("url_private_download")
            if dl_url:
                print(f"\n  Downloading from files.info url_private_download...")
                r2 = httpx.get(
                    dl_url,
                    headers={"Authorization": f"Bearer {bot_token}"},
                    follow_redirects=False,
                    timeout=30.0,
                )
                print(f"  Status: {r2.status_code}")
                print(f"  Content-Type: {r2.headers.get('content-type')}")
                if r2.status_code in (301, 302, 303, 307, 308):
                    redirect_url = r2.headers.get("location")
                    print(f"  Redirect to: {redirect_url}")
                    r3 = httpx.get(redirect_url, follow_redirects=True, timeout=30.0)
                    print(f"  Final Status: {r3.status_code}")
                    print(f"  Final Content-Type: {r3.headers.get('content-type')}")
                    print(f"  Final Content-Length: {len(r3.content)}")
                    if not r3.headers.get("content-type", "").startswith("text/html"):
                        # Try transcribing!
                        print("\n  Attempting Whisper transcription...")
                        ext = latest_file.get("filetype", "mp4")
                        client = OpenAI(api_key=OPENAI_API_KEY)
                        audio_file = io.BytesIO(r3.content)
                        audio_file.name = f"audio.{ext}"
                        transcript = client.audio.transcriptions.create(
                            model="whisper-1", file=audio_file
                        )
                        print(f"  TRANSCRIPT: {transcript.text}")
                elif r2.status_code == 200 and not r2.headers.get("content-type", "").startswith("text/html"):
                    print(f"  Content-Length: {len(r2.content)}")
                    # Try transcribing directly
                    print("\n  Attempting Whisper transcription...")
                    ext = latest_file.get("filetype", "mp4")
                    client = OpenAI(api_key=OPENAI_API_KEY)
                    audio_file = io.BytesIO(r2.content)
                    audio_file.name = f"audio.{ext}"
                    transcript = client.audio.transcriptions.create(
                        model="whisper-1", file=audio_file
                    )
                    print(f"  TRANSCRIPT: {transcript.text}")
        else:
            print(f"  files.list error: {data.get('error', 'no files found')}")
            print(f"  Full response: {data}")
    except Exception as e:
        print(f"  Error: {e}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    debug()
