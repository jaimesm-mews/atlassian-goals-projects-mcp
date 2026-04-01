# Atlassian Goals & Projects MCP Server

An [MCP](https://modelcontextprotocol.io) server that exposes **Atlassian Goals** and **Atlassian Projects** (Townsquare / Atlas) as tools for AI assistants (Claude, Cursor, etc.).

It wraps the Atlassian Gateway GraphQL API with Basic auth, giving any MCP-compatible client the ability to query goals, read status updates, search projects, and pull detailed project updates with highlights, risks, and linked Jira items.

## Tools

| Tool | Description |
|------|-------------|
| `get_goal` | Fetch a goal by key (id, name, owner, archived status) |
| `get_goal_latest_update` | Latest status update + detailed notes for a goal |
| `search_projects` | Search projects with optional TQL filter and pagination |
| `get_project_updates` | Detailed updates, highlights (decisions/learnings/risks), linked Jira items for one or more projects in a date range |

## Prerequisites

- Node.js 18+
- An [Atlassian API token](https://id.atlassian.com/manage-profile/security/api-tokens)
- Your Atlassian site's **Cloud ID** (see [Finding your Cloud ID](#finding-your-cloud-id))

## Setup

```bash
git clone https://github.com/your-org/atlassian-goals-mcp.git
cd atlassian-goals-mcp
npm install
npm run build
```

## Configuration

The server reads credentials from environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `ATLASSIAN_BASE_URL` | Your Atlassian site URL | `https://yoursite.atlassian.net` |
| `ATLASSIAN_EMAIL` | Account email for API auth | `you@company.com` |
| `ATLASSIAN_API_TOKEN` | API token (not password) | `ATATT3x...` |
| `ATLASSIAN_CLOUD_ID` | Site Cloud ID (UUID) | `a1b2c3d4-...` |

Copy `.env.example` to `.env` for local development.

### Finding your Cloud ID

Visit `https://yoursite.atlassian.net/_edge/tenant_info` in your browser. The `cloudId` field in the JSON response is what you need.

## Using with Cursor

Add to your Cursor MCP config (`.cursor/mcp.json` or user settings):

```json
{
  "mcpServers": {
    "atlassian-goals": {
      "command": "node",
      "args": ["/absolute/path/to/atlassian-goals-mcp/dist/index.js"],
      "env": {
        "ATLASSIAN_BASE_URL": "https://yoursite.atlassian.net",
        "ATLASSIAN_EMAIL": "you@company.com",
        "ATLASSIAN_API_TOKEN": "your-token",
        "ATLASSIAN_CLOUD_ID": "your-cloud-id"
      }
    }
  }
}
```

## Using with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "atlassian-goals": {
      "command": "node",
      "args": ["/absolute/path/to/atlassian-goals-mcp/dist/index.js"],
      "env": {
        "ATLASSIAN_BASE_URL": "https://yoursite.atlassian.net",
        "ATLASSIAN_EMAIL": "you@company.com",
        "ATLASSIAN_API_TOKEN": "your-token",
        "ATLASSIAN_CLOUD_ID": "your-cloud-id"
      }
    }
  }
}
```

## Example usage

Once connected, you can ask your AI assistant things like:

- "Fetch the goal MEWS-3761"
- "What's the latest update on goal MEWS-3762?"
- "Search for all Atlassian projects"
- "Get updates for projects MEWS-3866 and MEWS-4181 from 2026-03-24 to 2026-03-28"

## Development

```bash
npm run dev      # Run with tsx (no build step)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled version
```

## License

MIT
