import os
import sys
sys.path.insert(0, '/Users/waleedsamouh/ArcLogs/worker')

from dotenv import load_dotenv
from main import extract_insights

load_dotenv()

# Test data
responses = {
    "q1": "Yesterday I worked task 1 on authentication.",
    "q2": "Today I will finalize SQS integration for task 2.",
    "q3": "Blocked on deployment configuration Need help from @Farris Abu-Hadba."
}

questions = [
    {"id": "q1", "text": "What did you work on yesterday?"},
    {"id": "q2", "text": "What will you work on today?"},
    {"id": "q3", "text": "Any blockers?"}
]

print("=" * 80)
print("TESTING UPDATED AI EXTRACTION")
print("=" * 80)
print("\n📝 Input Responses:")
for q in questions:
    print(f"  {q['text']}")
    print(f"  → {responses[q['id']]}\n")

print("🤖 Running AI extraction with updated prompt...\n")

# Extract insights
insights = extract_insights(responses, questions)

print("=" * 80)
print("EXTRACTED INSIGHTS:")
print("=" * 80)

import json
print(json.dumps(insights, indent=2))

print("\n" + "=" * 80)
print("JIRA FIELD VALIDATION:")
print("=" * 80)

# Check if fields are at root level (not nested)
has_blockers = "blockers" in insights
has_jira_intent = "jira_intent" in insights
has_jira_keys = "referenced_jira_keys" in insights
has_jira_suggestions = "jira_suggestions" in insights

print(f"✓ blockers (root level): {'✅' if has_blockers else '❌'}")
print(f"✓ jira_intent (root level): {'✅' if has_jira_intent else '❌'}")
print(f"✓ referenced_jira_keys (root level): {'✅' if has_jira_keys else '❌'}")
print(f"✓ jira_suggestions (root level): {'✅' if has_jira_suggestions else '❌'}")

print("\n" + "=" * 80)
print("JIRA VALUES:")
print("=" * 80)
print(f"jira_intent: {insights.get('jira_intent', 'NOT SET')}")
print(f"referenced_jira_keys: {insights.get('referenced_jira_keys', 'NOT SET')}")
print(f"jira_suggestions: {insights.get('jira_suggestions', 'NOT SET')}")

print("\n" + "=" * 80)
print("EXPECTED:")
print("=" * 80)
print("jira_intent: 'create' (blocker mentioned)")
print("referenced_jira_keys: [] (no keys in text)")
print("jira_suggestions: Object with issue_type, priority, title, description")

print("\n" + "=" * 80)
if has_blockers and has_jira_intent and has_jira_keys and has_jira_suggestions:
    if insights.get('jira_intent') == 'create' and insights.get('jira_suggestions'):
        print("✅ SUCCESS! AI extraction is working correctly!")
    else:
        print("⚠️ WARNING: Fields are present but values are incorrect")
else:
    print("❌ FAILED: Fields are still nested or missing")
print("=" * 80)
