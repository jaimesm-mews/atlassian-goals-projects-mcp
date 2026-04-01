#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetGoal } from "./tools/get-goal.js";
import { registerGetGoalLatestUpdate } from "./tools/get-goal-latest-update.js";
import { registerSearchProjects } from "./tools/search-projects.js";
import { registerGetProjectUpdates } from "./tools/get-project-updates.js";

const server = new McpServer({
  name: "atlassian-goals-projects-mcp",
  version: "1.0.0",
});

registerGetGoal(server);
registerGetGoalLatestUpdate(server);
registerSearchProjects(server);
registerGetProjectUpdates(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
