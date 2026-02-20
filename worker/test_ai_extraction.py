import os
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai import OpenAIChat
import json
import re

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize Agent with GPT-4
agent = Agent(
    name="StandupAnalyzer",
    model=OpenAIChat(id="gpt-4", api_key=OPENAI_API_KEY),
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

# Test standup text
standup_text = """Daily Standup Response:

Q: What did you work on yesterday?
A: Yesterday I worked task 1 on authentication.

Q: What will you work on today?
A: Today I will finalize SQS integration for task 2.

Q: Any blockers?
A: Blocked on deployment configuration Need help from @Farris Abu-Hadba.

"""

# Create the analysis prompt with Jira fields
prompt = f"""Analyze this standup response and extract:

{standup_text}

Please provide a JSON response with:

**Core Insights:**
1. "blockers": Array of strings describing any blockers or obstacles mentioned
2. "help_needed": Array of objects with "topic" and "mentions" (usernames with @) if they're asking for help
3. "sentiment": One of "positive", "neutral", or "negative"
4. "action_items": Array of strings for any specific tasks or next steps mentioned
5. "summary": A brief 1-2 sentence summary of what this person is working on

**Jira Integration Fields:**
6. "referenced_jira_keys": Array of Jira issue keys mentioned (e.g., ["ABC-123", "PROJ-456"]). Look for patterns like UPPERCASE-NUMBER.
7. "jira_intent": Determine user's intent regarding Jira:
   - "create" if they mention blockers/issues without Jira keys (suggest creating a ticket)
   - "update" if they mention a Jira key with progress updates
   - "comment" if they mention a Jira key with additional context
   - "none" if no Jira-related intent
8. "jira_suggestions": Object with suggested Jira fields (only if jira_intent is "create" or "update"):
   {{
     "issue_type": One of "Bug", "Story", "Task", "Blocker" (infer from context)
     "priority": One of "Highest", "High", "Medium", "Low" (based on urgency words)
     "assignee": Username mentioned with @ or "unassigned"
     "title": Concise issue title (max 100 chars)
     "description": Detailed description formatted for Jira with context from standup
   }}

Example format:
{{
  "blockers": ["Waiting for API review", "Production database access needed"],
  "help_needed": [
    {{"topic": "Code review needed", "mentions": ["@john", "@sarah"]}},
    {{"topic": "Need help with deployment", "mentions": ["@devops"]}}
  ],
  "sentiment": "positive",
  "action_items": ["Deploy feature X", "Fix bug Y"],
  "summary": "Making good progress on feature X, will deploy today after code review.",
  "referenced_jira_keys": ["PROJ-123"],
  "jira_intent": "update",
  "jira_suggestions": {{
    "issue_type": "Story",
    "priority": "Medium",
    "assignee": "@john",
    "title": "Deploy feature X to production",
    "description": "User reported they are making progress on feature X and plan to deploy today after receiving code review from @john and @sarah."
  }}
}}

If no blockers/help/actions/jira keys are found, return empty arrays or "none" for jira_intent.
"""

print("=" * 80)
print("TESTING AI EXTRACTION WITH JIRA FIELDS")
print("=" * 80)
print("\n📝 Input Standup:\n")
print(standup_text)
print("\n🤖 Running AI extraction...\n")

# Run the agent
response = agent.run(prompt, stream=False)

print("=" * 80)
print("RAW AI RESPONSE:")
print("=" * 80)
print(response.content)
print()

# Parse the response
try:
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

    print("=" * 80)
    print("PARSED INSIGHTS:")
    print("=" * 80)
    print(json.dumps(insights, indent=2))
    print()

    print("=" * 80)
    print("JIRA FIELD VALIDATION:")
    print("=" * 80)
    print(f"✓ referenced_jira_keys: {insights.get('referenced_jira_keys', 'MISSING')}")
    print(f"✓ jira_intent: {insights.get('jira_intent', 'MISSING')}")
    print(f"✓ jira_suggestions: {insights.get('jira_suggestions', 'MISSING')}")
    print()

    # Expected values for this test
    print("=" * 80)
    print("EXPECTED VALUES FOR THIS TEST:")
    print("=" * 80)
    print("✓ referenced_jira_keys: [] (no Jira keys in text)")
    print("✓ jira_intent: 'create' (blocker mentioned without Jira key)")
    print("✓ jira_suggestions: Object with title, description, issue_type, priority")
    print()

    if insights.get('jira_intent') == 'create' and insights.get('jira_suggestions'):
        print("✅ AI extraction is working correctly!")
    else:
        print("❌ AI extraction is NOT returning expected Jira fields")

except json.JSONDecodeError as e:
    print(f"❌ Failed to parse AI response as JSON: {e}")
    print(f"Raw response: {response.content}")
except Exception as e:
    print(f"❌ Error: {e}")
