#!/bin/bash

echo "=========================================="
echo "Testing Frontend Test Connection API"
echo "=========================================="
echo ""

# Get credentials from database
DOMAIN=$(psql "$DATABASE_URL" -t -c "SELECT jira_domain FROM jira_connection WHERE deleted_at IS NULL LIMIT 1" | xargs)
EMAIL=$(psql "$DATABASE_URL" -t -c "SELECT jira_email FROM jira_connection WHERE deleted_at IS NULL LIMIT 1" | xargs)
TOKEN=$(psql "$DATABASE_URL" -t -c "SELECT jira_api_token FROM jira_connection WHERE deleted_at IS NULL LIMIT 1" | xargs)

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Token: ${TOKEN:0:15}..."
echo ""

# Test using ngrok URL
echo "=========================================="
echo "Testing via ngrok URL"
echo "=========================================="
echo ""

curl -X POST https://df142b4c55c5.ngrok-free.app/api/jira/test-connection \
  -H "Content-Type: application/json" \
  -d "{
    \"jiraDomain\": \"$DOMAIN\",
    \"jiraEmail\": \"$EMAIL\",
    \"jiraApiToken\": \"$TOKEN\"
  }" \
  -v

echo ""
echo ""
echo "=========================================="
echo "Check Next.js terminal for logs:"
echo "  [Jira Test] Starting test connection"
echo "  [Jira Test] Session valid for user: ..."
echo "  [Jira Test] Calling Jira API: ..."
echo "  [Jira Test] Success! Authenticated as: ..."
echo "=========================================="
