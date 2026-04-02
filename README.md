# Atlassian Goals & Projects MCP Server

An [MCP](https://modelcontextprotocol.io) server that gives AI assistants (Claude, Cursor, etc.) direct access to **Atlassian Goals** and **Atlassian Projects** via the Townsquare / Atlas GraphQL API.

Works on **macOS** and **Windows**. Each user authenticates with their own Atlassian API token.

## What you can do with this MCP

### Atlassian Goals

- Fetch any **Atlassian Goal** by key (name, owner, status)
- Read the **latest goal status update** including detailed notes

### Atlassian Projects

- **Search Atlassian Projects** with optional TQL filters and pagination
- Fetch **detailed project updates** within a date range, including:
  - Status update summaries
  - Highlights: decisions, learnings, and risks
  - Linked Jira work items (epic/issue key, summary, status, URL)
  - Update notes

## Tools

| Tool | Scope | Description |
|------|-------|-------------|
| `get_goal` | Goals | Fetch an Atlassian Goal by key (id, name, owner, archived status) |
| `get_goal_latest_update` | Goals | Latest status update + detailed notes for an Atlassian Goal |
| `search_projects` | Projects | Search Atlassian Projects with optional TQL filter and pagination |
| `get_project_updates` | Projects | Detailed updates, highlights (decisions/learnings/risks), linked Jira items for one or more Atlassian Projects in a date range |

## Prerequisites

- **Node.js 18+** (macOS and Windows)
- A personal **Atlassian API token** (each user creates their own)
- Your Atlassian site's **Cloud ID**

## Step 1: Generate your Atlassian API token

Each user needs their own token. Tokens are personal and should not be shared.

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Give it a label (e.g. "MCP Server") and click **Create**
4. **Copy the token immediately** — you will not be able to see it again

> Your API token inherits the permissions of your Atlassian account. It can read any Goal or Project you have access to.

## Step 2: Find your Cloud ID

Visit this URL in your browser (replace `yoursite` with your actual Atlassian subdomain):

```
https://yoursite.atlassian.net/_edge/tenant_info
```

The JSON response contains a `cloudId` field — copy that UUID value.

## Step 3: Clone and build

```bash
git clone https://github.com/jaimesm-mews/atlassian-goals-projects-mcp.git
cd atlassian-goals-projects-mcp
npm install
npm run build
```

## Step 4: Configure your MCP client

The server reads credentials from environment variables set in your MCP client config. You need four values:

| Variable | Description | Example |
|----------|-------------|---------|
| `ATLASSIAN_BASE_URL` | Your Atlassian site URL | `https://mews.atlassian.net` |
| `ATLASSIAN_EMAIL` | Your Atlassian account email | `you@mews.com` |
| `ATLASSIAN_API_TOKEN` | Your personal API token (from Step 1) | `ATATT3x...` |
| `ATLASSIAN_CLOUD_ID` | Site Cloud ID (from Step 2) | `a1b2c3d4-e5f6-...` |

### Cursor (macOS and Windows)

Add to your Cursor MCP config (`.cursor/mcp.json` in your project, or via Cursor Settings > MCP):

**macOS:**

```json
{
  "mcpServers": {
    "atlassian-goals-projects": {
      "command": "node",
      "args": ["/Users/yourname/atlassian-goals-projects-mcp/dist/index.js"],
      "env": {
        "ATLASSIAN_BASE_URL": "https://mews.atlassian.net",
        "ATLASSIAN_EMAIL": "you@mews.com",
        "ATLASSIAN_API_TOKEN": "your-token-here",
        "ATLASSIAN_CLOUD_ID": "your-cloud-id-here"
      }
    }
  }
}
```

**Windows:**

```json
{
  "mcpServers": {
    "atlassian-goals-projects": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\atlassian-goals-projects-mcp\\dist\\index.js"],
      "env": {
        "ATLASSIAN_BASE_URL": "https://mews.atlassian.net",
        "ATLASSIAN_EMAIL": "you@mews.com",
        "ATLASSIAN_API_TOKEN": "your-token-here",
        "ATLASSIAN_CLOUD_ID": "your-cloud-id-here"
      }
    }
  }
}
```

### Claude Desktop / Claude Enterprise

Add to your Claude config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "atlassian-goals-projects": {
      "command": "node",
      "args": ["/absolute/path/to/atlassian-goals-projects-mcp/dist/index.js"],
      "env": {
        "ATLASSIAN_BASE_URL": "https://mews.atlassian.net",
        "ATLASSIAN_EMAIL": "you@mews.com",
        "ATLASSIAN_API_TOKEN": "your-token-here",
        "ATLASSIAN_CLOUD_ID": "your-cloud-id-here"
      }
    }
  }
}
```

> **Windows users:** use double backslashes in paths (`C:\\Users\\...\\dist\\index.js`) or forward slashes (`C:/Users/.../dist/index.js`).

## Example usage

Once the MCP is connected, ask your AI assistant things like:

**Goals:**
- "Fetch the Atlassian Goal MEWS-3761"
- "What's the latest status update on goal MEWS-3762?"

**Projects:**
- "Search for all Atlassian Projects"
- "Search Atlassian Projects matching key MEWS-3866"
- "Get updates for Atlassian Projects MEWS-3866 and MEWS-4181 from 2026-03-24 to 2026-03-28"

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Missing required environment variable` | Check that all 4 `ATLASSIAN_*` env vars are set in your MCP client config |
| `401 Unauthorized` | Verify your email and API token are correct. Tokens expire if revoked at [API token management](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `Goal X not found` | Check the goal key is correct (e.g. `MEWS-3761`, not just `3761`) |
| Server not appearing in Cursor/Claude | Restart the MCP client after changing config. Check the path to `dist/index.js` is absolute and correct for your OS |

## Development

```bash
npm run dev      # Run with tsx (no build step, hot reload)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled version
```

## License

MIT
