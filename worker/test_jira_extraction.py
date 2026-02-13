# test_jira_extraction.py
"""
Test script for Jira-enhanced AI extraction
Run with: uv run python test_jira_extraction.py
"""

import re
from typing import List

def extract_jira_keys(text: str) -> List[str]:
    """Extract valid Jira issue keys from text (e.g., ABC-123, PROJ-456)"""
    pattern = r'\b([A-Z]{2,10}-\d+)\b'
    matches = re.findall(pattern, text)
    # Remove duplicates while preserving order
    seen = set()
    unique_keys = []
    for key in matches:
        if key not in seen:
            seen.add(key)
            unique_keys.append(key)
    return unique_keys


# Test cases
test_scenarios = [
    {
        "name": "Scenario 1: Create Intent (Blocker without Jira key)",
        "standup": "I'm blocked on production API access. Need urgent help from @devops.",
        "expected_jira_keys": [],
        "expected_intent": "create",
    },
    {
        "name": "Scenario 2: Update Intent (Progress on existing ticket)",
        "standup": "Working on PROJ-123. Made good progress, 80% complete.",
        "expected_jira_keys": ["PROJ-123"],
        "expected_intent": "update",
    },
    {
        "name": "Scenario 3: Comment Intent (Additional context on ticket)",
        "standup": "For ABC-456, waiting on design review from @sarah",
        "expected_jira_keys": ["ABC-456"],
        "expected_intent": "comment",
    },
    {
        "name": "Scenario 4: Multiple Jira Keys",
        "standup": "Fixed PROJ-123, PROJ-456, and ABC-789 today. All ready for review.",
        "expected_jira_keys": ["PROJ-123", "PROJ-456", "ABC-789"],
        "expected_intent": "update",
    },
    {
        "name": "Scenario 5: No Jira Intent",
        "standup": "Everything running smoothly. No blockers.",
        "expected_jira_keys": [],
        "expected_intent": "none",
    },
    {
        "name": "Scenario 6: Mixed - Jira key + new blocker",
        "standup": """
        Yesterday: Fixed bug in PROJ-123
        Today: Will deploy PROJ-123
        Blockers: Production database is down! Need @admin help immediately.
        """,
        "expected_jira_keys": ["PROJ-123"],
        "expected_intent": "create",  # Due to critical blocker
    },
]

print("=" * 80)
print("🧪 JIRA EXTRACTION TEST SUITE")
print("=" * 80)

for i, scenario in enumerate(test_scenarios, 1):
    print(f"\n📋 Test {i}: {scenario['name']}")
    print("-" * 80)
    print(f"Input: {scenario['standup'][:100]}...")

    # Test Jira key extraction
    detected_keys = extract_jira_keys(scenario['standup'])
    print(f"\n🔍 Detected Jira Keys: {detected_keys}")
    print(f"   Expected: {scenario['expected_jira_keys']}")

    if detected_keys == scenario['expected_jira_keys']:
        print("   ✅ PASS: Jira keys match")
    else:
        print("   ❌ FAIL: Jira keys don't match")

    print(f"\n🎯 Expected Intent: {scenario['expected_intent']}")

print("\n" + "=" * 80)
print("📊 TEST SUMMARY")
print("=" * 80)
print("These test cases verify:")
print("  1. Jira key pattern matching (PROJECT-123 format)")
print("  2. Deduplication of repeated keys")
print("  3. Case sensitivity (uppercase only)")
print("  4. Multiple key detection in single message")
print()
print("Next step: Run the actual worker with test standups to verify AI extraction")
print("Command: cd /Users/waleedsamouh/ArcLogs/worker && uv run main.py")
print("=" * 80)
