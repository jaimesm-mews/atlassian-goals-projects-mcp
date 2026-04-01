import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClientConfig, graphqlQuery } from "../lib/graphql-client.js";
import { parseAdfToPlainText } from "../lib/adf-parser.js";

const inputSchema = {
  projectKeys: z
    .array(z.string())
    .min(1)
    .describe('Array of Atlassian Project keys, e.g. ["MEWS-3866", "MEWS-4181"]'),
  dateFrom: z
    .string()
    .describe("Start date (YYYY-MM-DD) for the update range"),
  dateTo: z
    .string()
    .describe("End date (YYYY-MM-DD) for the update range"),
};

interface HighlightNode {
  __typename: string;
  id: string;
  summary: string;
  description: unknown;
  creationDate: string;
  resolvedDate?: string;
}

interface UpdateNoteNode {
  id: string;
  summary: string;
  description: unknown;
  creationDate: string;
}

interface UpdateNode {
  id: string;
  summary: unknown;
  creationDate: string;
  updateType: string;
  url: string;
  updateNotes: { edges: Array<{ node: UpdateNoteNode }> };
  highlights: { edges: Array<{ node: HighlightNode }> };
}

interface JiraItemNode {
  __typename: string;
  id?: string;
  key?: string;
  summary?: string;
  issueType?: { name: string };
  status?: { name: string };
  webUrl?: string;
}

interface DetailedProjectNode {
  id: string;
  key: string;
  name: string;
  archived: boolean;
  linkedJiraWorkItems: { edges: Array<{ node: JiraItemNode }> };
  updates: { edges: Array<{ node: UpdateNode }> };
}

interface DetailedSearchResponse {
  projects_search: {
    edges: Array<{ node: DetailedProjectNode }>;
  };
}

export function registerGetProjectUpdates(server: McpServer): void {
  server.tool(
    "get_project_updates",
    "Fetch detailed updates, highlights (decisions/learnings/risks), linked Jira items, and update notes for one or more Atlassian Projects within a date range.",
    inputSchema,
    async ({ projectKeys, dateFrom, dateTo }) => {
      const { containerIdString } = getClientConfig();
      const rangeStart = new Date(dateFrom + "T00:00:00.000Z");
      const rangeEnd = new Date(dateTo + "T23:59:59.999Z");

      if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid date format. Use YYYY-MM-DD.",
            },
          ],
        };
      }

      const detailedQuery = `
        query GetProjectDetails($containerId: String!, $searchString: String!, $first: Int!) {
          projects_search(
            containerId: $containerId
            searchString: $searchString
            first: $first
          ) @optIn(to: "Townsquare") {
            edges {
              node {
                id
                key
                name
                archived
                linkedJiraWorkItems @optIn(to: "GraphStoreAtlasProjectTrackedOnJiraWorkItem") {
                  edges {
                    node {
                      __typename
                      ... on JiraIssue {
                        id
                        key
                        summary
                        issueType { name }
                        status { name }
                        webUrl
                      }
                    }
                  }
                }
                updates {
                  edges {
                    node {
                      id
                      summary
                      creationDate
                      updateType
                      url
                      updateNotes {
                        edges {
                          node {
                            id
                            summary
                            description
                            creationDate
                          }
                        }
                      }
                      highlights {
                        edges {
                          node {
                            __typename
                            ... on TownsquareDecision {
                              id
                              summary
                              description
                              creationDate
                            }
                            ... on TownsquareLearning {
                              id
                              summary
                              description
                              creationDate
                            }
                            ... on TownsquareRisk {
                              id
                              summary
                              description
                              creationDate
                              resolvedDate
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const BATCH = 10;
      const updatesByProject: Record<string, unknown> = {};

      for (let i = 0; i < projectKeys.length; i += BATCH) {
        const batch = projectKeys.slice(i, i + BATCH);
        const searchString = `key IN (${batch.map((k) => `"${k}"`).join(", ")})`;

        const data = await graphqlQuery<DetailedSearchResponse>(detailedQuery, {
          containerId: containerIdString,
          searchString,
          first: BATCH,
        });

        for (const edge of data.projects_search?.edges ?? []) {
          const project = edge.node;
          const allUpdates =
            project.updates?.edges?.map((e) => e.node) ?? [];
          const inRange = allUpdates.filter((u) => {
            if (!u.creationDate) return false;
            const d = new Date(u.creationDate);
            return d >= rangeStart && d <= rangeEnd;
          });

          const notes = inRange.flatMap((u) =>
            (u.updateNotes?.edges?.map((e) => e.node) ?? []).map((n) => ({
              summary: n.summary,
              description: parseAdfToPlainText(n.description),
              creationDate: n.creationDate,
            }))
          );

          const highlights = inRange.flatMap((u) =>
            (u.highlights?.edges?.map((e) => e.node) ?? []).map((h) => ({
              type: h.__typename,
              summary: h.summary,
              description: parseAdfToPlainText(h.description),
              creationDate: h.creationDate,
            }))
          );

          const jiraItems = (
            project.linkedJiraWorkItems?.edges?.map((e) => e.node) ?? []
          ).filter(Boolean);

          updatesByProject[project.key] = {
            key: project.key,
            name: project.name,
            archived: project.archived,
            linkedJiraItems: jiraItems.map((j) => ({
              key: j.key,
              summary: j.summary,
              issueType: j.issueType?.name,
              status: j.status?.name,
              webUrl: j.webUrl,
            })),
            updatesInRange: inRange.map((u) => ({
              id: u.id,
              summary: parseAdfToPlainText(u.summary),
              creationDate: u.creationDate,
              updateType: u.updateType,
              url: u.url,
              notes,
              highlights,
            })),
          };
        }
      }

      const result = {
        dateFrom,
        dateTo,
        requestedKeys: projectKeys,
        updatesByProject,
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
