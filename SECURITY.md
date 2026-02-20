# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ArcLogs, please email: waleed.samouh02@gmail.com

**Please do not open a public issue for security vulnerabilities.**

## Sensitive Data Handling

ArcLogs handles sensitive data including:
- Slack workspace tokens and user data
- Jira API credentials
- OpenAI API keys
- AWS credentials
- User emails and authentication data

### How We Protect Data:
- All secrets are stored in environment variables (never in code)
- Database uses SSL/TLS encryption
- Slack and Jira tokens are encrypted at rest
- API endpoints validate signatures (Slack) and use authentication
- Multi-tenant architecture with org-level data isolation

## Environment Variables

**NEVER commit `.env` files to version control.**

Use `.env.example` files as templates. All production secrets should be:
1. Rotated regularly
2. Stored in secure secret management (AWS Secrets Manager, Vercel env vars, etc.)
3. Limited to least-privilege access

## Dependency Security

We regularly update dependencies to patch security vulnerabilities. Run:
```bash
npm audit --audit-level=moderate  # Application
uv pip list --outdated            # Worker
```

## Secure Development

- API routes use Better Auth for authentication
- Slack events verify request signatures
- Cron endpoints require a secret token
- Database queries use parameterized statements (Drizzle ORM)
- File uploads are validated (type, size, duration)
