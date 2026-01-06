# worker/main.py
import os
import json
import time
import boto3
from dotenv import load_dotenv
from agno import Agno, Runner
from agno.models.openai import OpenAI
import httpx
import re
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

# Configuration
SQS_QUEUE_URL = os.getenv("AWS_SQS_QUEUE_URL")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")

# Initialize SQS
sqs = boto3.client(
    "sqs",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# Initialize Agno with GPT-5-nano
agno = Agno(
    name="StandupAnalyzer",
    model=OpenAI(id="gpt-5-nano", api_key=OPENAI_API_KEY),
    description="Analyzes daily standup responses to extract insights, blockers, help requests, and sentiment",
    instructions=[
        "You are an expert at analyzing team standup responses.",
        "Extract key information: blockers, help requests (with @mentions), sentiment, and action items.",
        "Be concise and accurate. Focus on actionable insights.",
        "When someone mentions needing help or asks for assistance, identify who they're asking.",
        "Detect sentiment: positive (making progress), neutral (routine updates), negative (blocked/frustrated).",
    ],
    markdown=True,
)


# Database helper
def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


# Extract insights from responses using Agno
def extract_insights(responses: Dict[str, str], questions: List[Dict]) -> Dict:
    """Use Agno agent to extract insights from standup responses"""
    
    # Format the standup for analysis
    standup_text = "Daily Standup Response:\n\n"
    for question in questions:
        answer = responses.get(question["id"], "No answer")
        standup_text += f"Q: {question['text']}\nA: {answer}\n\n"
    
    # Create the analysis prompt
    prompt = f"""Analyze this standup response and extract:

{standup_text}

Please provide a JSON response with:
1. "blockers": Array of strings describing any blockers or obstacles mentioned
2. "help_needed": Array of objects with "topic" and "mentions" (usernames with @) if they're asking for help
3. "sentiment": One of "positive", "neutral", or "negative"
4. "action_items": Array of strings for any specific tasks or next steps mentioned
5. "summary": A brief 1-2 sentence summary of what this person is working on

Example format:
{{
  "blockers": ["Waiting for API review", "Production database access needed"],
  "help_needed": [
    {{"topic": "Code review needed", "mentions": ["@john", "@sarah"]}},
    {{"topic": "Need help with deployment", "mentions": ["@devops"]}}
  ],
  "sentiment": "positive",
  "action_items": ["Deploy feature X", "Fix bug Y"],
  "summary": "Making good progress on feature X, will deploy today after code review."
}}

If no blockers/help/actions are found, return empty arrays.
"""
    
    # Run the agent
    runner = Runner(agent=agno, stream=False)
    response = runner.run(prompt)
    
    # Parse the response
    try:
        # Extract JSON from markdown code blocks if present
        content = response.content
        if "```json" in content:
            json_match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
        elif "```" in content:
            json_match = re.search(r"```\s*(\{.*?\})\s*```", content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
        
        insights = json.loads(content)
        return insights
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse AI response as JSON: {e}")
        print(f"Raw response: {response.content}")
        # Return minimal structure
        return {
            "blockers": [],
            "help_needed": [],
            "sentiment": "neutral",
            "action_items": [],
            "summary": "Unable to process response",
        }


# Get Slack user ID by email or username
def get_slack_user_id(bot_token: str, identifier: str) -> Optional[str]:
    """Get Slack user ID from @mention or email"""
    # Remove @ if present
    identifier = identifier.lstrip("@")
    
    try:
        # Try to find user by email first
        if "@" in identifier:
            response = httpx.post(
                "https://slack.com/api/users.lookupByEmail",
                headers={"Authorization": f"Bearer {bot_token}"},
                json={"email": identifier},
            )
            data = response.json()
            if data.get("ok"):
                return data["user"]["id"]
        
        # Otherwise, search by display name or real name
        response = httpx.get(
            "https://slack.com/api/users.list",
            headers={"Authorization": f"Bearer {bot_token}"},
        )
        data = response.json()
        
        if data.get("ok"):
            for user in data.get("members", []):
                if (
                    user.get("name") == identifier
                    or user.get("real_name", "").lower() == identifier.lower()
                    or user.get("profile", {}).get("display_name", "").lower() == identifier.lower()
                ):
                    return user["id"]
    except Exception as e:
        print(f"❌ Error looking up Slack user {identifier}: {e}")
    
    return None


# Send Slack notification
def send_slack_notification(bot_token: str, user_id: str, message: str):
    """Send a DM to a Slack user"""
    try:
        response = httpx.post(
            "https://slack.com/api/chat.postMessage",
            headers={
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json",
            },
            json={
                "channel": user_id,
                "text": message,
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": message,
                        },
                    },
                ],
            },
        )
        data = response.json()
        return data.get("ok", False)
    except Exception as e:
        print(f"❌ Error sending Slack notification: {e}")
        return False


# Post digest to team channel
def post_team_digest(bot_token: str, channel_id: str, digest: str):
    """Post standup digest to team channel"""
    try:
        response = httpx.post(
            "https://slack.com/api/chat.postMessage",
            headers={
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json",
            },
            json={
                "channel": channel_id,
                "text": digest,
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "📊 Daily Standup Summary",
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": digest,
                        },
                    },
                ],
            },
        )
        data = response.json()
        return data.get("ok", False)
    except Exception as e:
        print(f"❌ Error posting team digest: {e}")
        return False


# Process a single standup response
def process_standup_response(message_data: Dict):
    """Process a standup response and extract insights"""
    
    response_id = message_data.get("responseId")
    
    if not response_id:
        print("❌ No response ID in message")
        return
    
    print(f"🔄 Processing response {response_id}")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get response data with related info
        cur.execute("""
            SELECT 
                sr.*,
                sc.questions,
                sc.name as standup_name,
                t.name as team_name,
                t.slack_channel_id,
                t.organization_id,
                u.email as user_email,
                u.name as user_name
            FROM standup_response sr
            JOIN standup_config sc ON sr.standup_config_id = sc.id
            JOIN team t ON sr.team_id = t.id
            JOIN "user" u ON sr.user_id = u.id
            WHERE sr.id = %s AND sr.deleted_at IS NULL
        """, (response_id,))
        
        response_data = cur.fetchone()
        
        if not response_data:
            print(f"❌ Response {response_id} not found")
            return
        
        print(f"📝 Analyzing response from {response_data['user_name']}")
        
        # Extract insights using Agno
        insights = extract_insights(
            response_data["responses"],
            response_data["questions"]
        )
        
        print(f"✅ Extracted insights: {json.dumps(insights, indent=2)}")
        
        # Update response with AI insights
        cur.execute("""
            UPDATE standup_response
            SET 
                ai_insights = %s,
                processing_status = 'completed',
                processed_at = NOW(),
                updated_at = NOW()
            WHERE id = %s
        """, (json.dumps(insights), response_id))
        
        # Get Slack workspace
        cur.execute("""
            SELECT bot_token, slack_team_id
            FROM slack_workspace
            WHERE organization_id = %s AND deleted_at IS NULL
        """, (response_data["organization_id"],))
        
        workspace = cur.fetchone()
        
        if not workspace:
            print("❌ No Slack workspace found")
            conn.commit()
            return
        
        bot_token = workspace["bot_token"]
        
        # Process help requests
        help_requests = insights.get("help_needed", [])
        if help_requests:
            print(f"🆘 Found {len(help_requests)} help requests")
            
            for help_req in help_requests:
                topic = help_req.get("topic", "General help needed")
                mentions = help_req.get("mentions", [])
                
                # Create help_request record
                cur.execute("""
                    INSERT INTO help_request (
                        id, response_id, team_id, requester_id,
                        mentioned_slack_user_ids, description, topic,
                        status, created_at, updated_at
                    )
                    VALUES (
                        gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, 'open', NOW(), NOW()
                    )
                    RETURNING id
                """, (
                    response_id,
                    response_data["team_id"],
                    response_data["user_id"],
                    json.dumps(mentions),
                    f"{response_data['user_name']} needs help: {topic}",
                    topic,
                ))
                
                help_request_id = cur.fetchone()["id"]
                
                # Send notifications to mentioned users
                for mention in mentions:
                    slack_user_id = get_slack_user_id(bot_token, mention)
                    
                    if slack_user_id:
                        message = f"""🆘 *Help Request from {response_data['user_name']}*

Team: {response_data['team_name']}
Topic: {topic}

From their standup:
{insights.get('summary', 'See full standup for details')}

_Reply in #{response_data['team_name']} or DM them directly._"""
                        
                        success = send_slack_notification(bot_token, slack_user_id, message)
                        if success:
                            print(f"✉️ Notified {mention} about help request")
                        else:
                            print(f"❌ Failed to notify {mention}")
                
                # Mark notifications as sent
                cur.execute("""
                    UPDATE help_request
                    SET notifications_sent = true, notifications_sent_at = NOW()
                    WHERE id = %s
                """, (help_request_id,))
        
        # Create insight record for blockers
        blockers = insights.get("blockers", [])
        if blockers:
            print(f"🚧 Found {len(blockers)} blockers")
            
            cur.execute("""
                INSERT INTO insight (
                    id, team_id, related_response_ids, insight_date,
                    insight_type, title, description, severity, status,
                    created_at, updated_at
                )
                VALUES (
                    gen_random_uuid()::text, %s, %s, CURRENT_DATE, 
                    'blocker', %s, %s, %s, 'open', NOW(), NOW()
                )
            """, (
                response_data["team_id"],
                json.dumps([response_id]),
                f"Blockers reported by {response_data['user_name']}",
                "\n".join([f"• {blocker}" for blocker in blockers]),
                "high" if len(blockers) > 1 else "medium",
            ))
        
        # Commit all changes
        conn.commit()
        
        print(f"✅ Successfully processed response {response_id}")
        
    except Exception as e:
        print(f"❌ Error processing response {response_id}: {e}")
        conn.rollback()
        
        # Mark as failed
        try:
            cur.execute("""
                UPDATE standup_response
                SET processing_status = 'failed', updated_at = NOW()
                WHERE id = %s
            """, (response_id,))
            conn.commit()
        except:
            pass
    
    finally:
        cur.close()
        conn.close()


# Generate daily digest for team
def generate_team_digest(team_id: str, date: str):
    """Generate and post daily digest to team channel"""
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get all responses for the team today
        cur.execute("""
            SELECT 
                sr.ai_insights,
                u.name as user_name
            FROM standup_response sr
            JOIN "user" u ON sr.user_id = u.id
            WHERE sr.team_id = %s 
            AND sr.response_date = %s 
            AND sr.processing_status = 'completed'
            AND sr.deleted_at IS NULL
            ORDER BY sr.created_at
        """, (team_id, date))
        
        responses = cur.fetchall()
        
        if not responses:
            print(f"No responses to digest for team {team_id}")
            return
        
        # Get team info
        cur.execute("""
            SELECT t.name, t.slack_channel_id, t.organization_id
            FROM team t
            WHERE t.id = %s
        """, (team_id,))
        
        team = cur.fetchone()
        
        if not team or not team["slack_channel_id"]:
            print(f"Team {team_id} has no Slack channel configured")
            return
        
        # Get workspace
        cur.execute("""
            SELECT bot_token
            FROM slack_workspace
            WHERE organization_id = %s AND deleted_at IS NULL
        """, (team["organization_id"],))
        
        workspace = cur.fetchone()
        
        if not workspace:
            print(f"No workspace for team {team_id}")
            return
        
        # Build digest
        digest = f"*{len(responses)} team members* submitted their standup today:\n\n"
        
        all_blockers = []
        all_help_requests = []
        positive_count = 0
        
        for resp in responses:
            insights = resp["ai_insights"]
            user_name = resp["user_name"]
            
            summary = insights.get("summary", "")
            digest += f"*{user_name}:* {summary}\n"
            
            # Collect blockers
            blockers = insights.get("blockers", [])
            if blockers:
                all_blockers.extend([f"{user_name}: {b}" for b in blockers])
            
            # Collect help requests
            help_needed = insights.get("help_needed", [])
            if help_needed:
                all_help_requests.extend([f"{user_name} needs help with: {h.get('topic', 'Unknown')}" for h in help_needed])
            
            # Count sentiment
            if insights.get("sentiment") == "positive":
                positive_count += 1
        
        digest += "\n"
        
        # Add blockers section
        if all_blockers:
            digest += f"\n🚧 *Blockers:*\n"
            for blocker in all_blockers:
                digest += f"• {blocker}\n"
        
        # Add help requests section
        if all_help_requests:
            digest += f"\n🆘 *Help Needed:*\n"
            for req in all_help_requests:
                digest += f"• {req}\n"
        
        # Add team mood
        mood_emoji = "😊" if positive_count > len(responses) / 2 else "😐" if positive_count > len(responses) / 4 else "😟"
        digest += f"\n{mood_emoji} *Team Mood:* {positive_count}/{len(responses)} positive updates"
        
        # Post to channel
        success = post_team_digest(
            workspace["bot_token"],
            team["slack_channel_id"],
            digest
        )
        
        if success:
            print(f"✅ Posted digest to #{team['name']} channel")
        else:
            print(f"❌ Failed to post digest to #{team['name']} channel")
    
    except Exception as e:
        print(f"❌ Error generating digest: {e}")
    finally:
        cur.close()
        conn.close()


# Main worker loop
def main():
    print("🚀 ArcLogs AI Worker started")
    print(f"📬 Polling SQS queue: {SQS_QUEUE_URL}")
    
    while True:
        try:
            # Poll for messages
            response = sqs.receive_message(
                QueueUrl=SQS_QUEUE_URL,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20,  # Long polling
                VisibilityTimeout=300,  # 5 minutes to process
            )
            
            messages = response.get("Messages", [])
            
            if not messages:
                print("💤 No messages, waiting...")
                continue
            
            print(f"📨 Received {len(messages)} messages")
            
            for message in messages:
                try:
                    # Parse message
                    body = json.loads(message["Body"])
                    message_type = body.get("type")
                    
                    if message_type == "standup_response":
                        process_standup_response(body)
                    elif message_type == "generate_digest":
                        generate_team_digest(body.get("teamId"), body.get("date"))
                    else:
                        print(f"⚠️ Unknown message type: {message_type}")
                    
                    # Delete message from queue
                    sqs.delete_message(
                        QueueUrl=SQS_QUEUE_URL,
                        ReceiptHandle=message["ReceiptHandle"],
                    )
                    print(f"✅ Deleted message from queue")
                    
                except Exception as e:
                    print(f"❌ Error processing message: {e}")
                    # Message will become visible again after timeout
        
        except KeyboardInterrupt:
            print("\n👋 Worker stopped by user")
            break
        except Exception as e:
            print(f"❌ Worker error: {e}")
            time.sleep(5)  # Wait before retrying


if __name__ == "__main__":
    main()