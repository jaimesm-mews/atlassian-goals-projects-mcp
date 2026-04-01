import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClientConfig, graphqlQuery } from "../lib/graphql-client.js";

const inputSchema = {
  goalKey: z
    .string()
    .describe("Atlassian Goal key, e.g. MEWS-3761"),
};

interface GoalByKeyResponse {
  goals_byKey: {
    id: string;
    key: string;
    name: string;
    owner: { accountId: string } | null;
    archived: boolean;
  } | null;
}

export function registerGetGoal(server: McpServer): void {
  server.tool(
    "get_goal",
    "Fetch an Atlassian Goal by its key. Returns the goal's id, key, name, owner, and archived status.",
    inputSchema,
    async ({ goalKey }) => {
      const { containerIdARI } = getClientConfig();
      const q = `
        query GetGoalByKey($containerId: ID!, $goalKey: String!) {
          goals_byKey(containerId: $containerId, goalKey: $goalKey) @optIn(to: "Townsquare") {
            id
            key
            name
            owner { accountId }
            archived
          }
        }
      `;
      const data = await graphqlQuery<GoalByKeyResponse>(q, {
        containerId: containerIdARI,
        goalKey,
      });
      const goal = data?.goals_byKey;
      if (!goal) {
        return {
          content: [
            { type: "text" as const, text: `Goal ${goalKey} not found.` },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(goal, null, 2),
          },
        ],
      };
    }
  );
}
