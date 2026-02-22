# ArcLogs Architecture: Slack & Jira Integration

## 🏗️ Multi-Tenant Design

### Organization Level (One per Org)

**Slack Workspace Connection**
- ✅ ONE Slack workspace per organization
- Connected via OAuth at `/settings`
- Provides: bot token, access to all channels and users
- **Why org-level?** Most companies have one Slack workspace

**Jira Connection**
- ✅ ONE Jira instance connection per organization
- Connected via API token at `/settings/jira`
- Provides: domain, email, API credentials
- **Why org-level?** Most companies have one Jira instance

### Team Level (Many per Org)

**Slack Channel Selection**
- ⚙️ Each team selects a channel from the org's workspace
- Set in team settings: `/teams/{id}/settings` → General tab
- Purpose: Where daily standup digests are posted
- **Can be different per team:**
  - Engineering → #engineering
  - Marketing → #marketing
  - Sales → #sales

**Jira Project Override**
- ⚙️ Each team can optionally override the Jira project
- Set in team settings: `/teams/{id}/settings` → Jira tab
- Purpose: Work in different projects on the same Jira instance
- **Can be different per team:**
  - Engineering → SCRUM project
  - Marketing → MARK project
  - Sales → Uses org default

---

## 📊 Visual Architecture

```
Organization: "Acme Corp"
├── Slack Workspace: acme.slack.com (ORG-LEVEL)
│   ├── Bot Token: xoxb-...
│   ├── Available Channels: #engineering, #marketing, #sales, #general
│   └── Available Users: All workspace members
│
├── Jira Connection: acme.atlassian.net (ORG-LEVEL)
│   ├── API Token: ...
│   ├── Default Project: PROJ
│   └── Default Board: Main Board
│
└── Teams (TEAM-LEVEL)
    ├── Engineering Team
    │   ├── Slack Channel: #engineering (selected from org workspace)
    │   ├── Jira Project: SCRUM (override)
    │   ├── Members: 12 engineers from org workspace
    │   └── Standup Config: 3 questions, 9 AM PT, Mon-Fri
    │
    ├── Marketing Team
    │   ├── Slack Channel: #marketing (selected from org workspace)
    │   ├── Jira Project: MARK (override)
    │   ├── Members: 8 marketers from org workspace
    │   └── Standup Config: 4 questions, 10 AM ET, Mon-Thu
    │
    └── Sales Team
        ├── Slack Channel: #sales (selected from org workspace)
        ├── Jira Project: PROJ (uses org default)
        ├── Members: 15 sales reps from org workspace
        └── Standup Config: 2 questions, 11 AM CT, Mon-Fri
```

---

## 🔄 Data Flow

### Standup Request Flow:
1. Team's scheduled time arrives
2. Worker sends DMs to team members via org's bot token
3. Users reply in Slack DM
4. Worker processes with GPT-4
5. Worker posts digest to team's selected channel
6. Worker updates team's Jira project (or org default)

### Channel Selection:
1. User goes to team page
2. Clicks "Select Channel" in Channel card
3. Redirected to `/teams/{id}/settings`
4. Selects from dropdown of org's workspace channels
5. Saves → digests now post to that channel

### Jira Project Selection:
1. User goes to team settings
2. Switches to "Jira Integration" tab
3. Toggles "Use Custom Jira Project"
4. Enters team's project key (e.g., "SCRUM")
5. Saves → worker now uses that project for this team

---

## ❓ FAQs

**Q: Can I connect multiple Slack workspaces?**
A: Not currently. The architecture supports one workspace per organization. Most companies only need one.

**Q: What if I have multiple Jira instances?**
A: Not currently supported. You'd need separate ArcLogs organizations for each Jira instance.

**Q: Can teams have their own Slack bots?**
A: No. All teams share the org's Slack bot. Teams configure which channel receives digests.

**Q: What's the difference between org settings and team settings?**
A:
- **Org Settings** (`/settings`): Connect Slack workspace, connect Jira instance
- **Team Settings** (`/teams/{id}/settings`): Select channel, override Jira project, manage members

**Q: Where do I add a Slack channel for a team?**
A: Team page → "Channel" card → "Select Channel" button → Settings → General tab

**Q: Where do I configure a team's Jira project?**
A: Team page → "Settings" button → "Jira Integration" tab → Toggle override

---

## 🎯 Summary

| Feature | Organization Level | Team Level |
|---------|-------------------|------------|
| Slack Workspace | ✅ Connect once | - |
| Slack Channel | - | ⚙️ Select per team |
| Jira Instance | ✅ Connect once | - |
| Jira Project | ✅ Set default | ⚙️ Override per team |
| Members | - | ⚙️ Select per team |
| Standup Config | - | ⚙️ Configure per team |

**Simple Rule:** Connect integrations once at org level, configure specifics per team.
