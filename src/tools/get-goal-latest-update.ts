import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClientConfig, graphqlQuery } from "../lib/graphql-client.js";
import { parseAdfField } from "../lib/adf-parser.js";

const inputSchema = {
  goalKey: z
    .string()
    .describe("Atlassian Goal key, e.g. MEWS-3762"),
};

interface UpdateNoteNode {
  description: unknown;
  summary: unknown;
}

interface UpdateNode {
  id: string;
  summary: unknown;
  creationDate: string;
  updateNotes: {
    edges: Array<{ node: UpdateNoteNode }>;
  };
}

interface GoalWithUpdatesResponse {
  goals_byKey: {
    id: string;
    key: string;
    name: string;
    updates: {
      edges: Array<{ node: UpdateNode }>;
    };
  } | null;
}

export function registerGetGoalLatestUpdate(server: McpServer): void {
  server.tool(
    "get_goal_latest_update",
    "Fetch the latest status update (summary + detailed notes) for an Atlassian Goal.",
    inputSchema,
    async ({ goalKey }) => {
      const { containerIdARI } = getClientConfig();
      const q = `
        query GetGoalWithUpdates($containerId: ID!, $goalKey: String!) {
          goals_byKey(containerId: $containerId, goalKey: $goalKey) @optIn(to: "Townsquare") {
            id
            key
            name
            updates(first: 1) {
              edges {
                node {
                  id
                  summary
                  creationDate
                  updateNotes {
                    edges {
                      node {
                        description
                        summary
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const data = await graphqlQuery<GoalWithUpdatesResponse>(q, {
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

      const node = goal.updates?.edges?.[0]?.node;
      if (!node) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Goal ${goalKey} (${goal.name}) has no updates.`,
            },
          ],
        };
      }

      const parts: string[] = [];
      const summaryText = parseAdfField(node.summary);
      if (summaryText.trim()) parts.push(summaryText.trim());

      for (const edge of node.updateNotes?.edges ?? []) {
        const note = edge?.node;
        if (!note) continue;
        const noteText = parseAdfField(note.description ?? note.summary);
        if (noteText.trim()) parts.push(noteText.trim());
      }

      const result = {
        goalKey: goal.key,
        goalName: goal.name,
        creationDate: node.creationDate,
        summary: parts.join("\n\n") || "(empty update)",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
