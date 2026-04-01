import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClientConfig, graphqlQuery } from "../lib/graphql-client.js";

const inputSchema = {
  searchString: z
    .string()
    .optional()
    .default("")
    .describe(
      'TQL search string for projects (e.g. \'key IN ("MEWS-3866", "MEWS-4181")\' or empty for all)'
    ),
  first: z
    .number()
    .optional()
    .default(50)
    .describe("Max projects to return per page (default 50, max 50)"),
  after: z
    .string()
    .optional()
    .describe("Pagination cursor from a previous response"),
};

interface ProjectNode {
  id: string;
  key: string;
  name: string;
  archived: boolean;
  state: { label: string } | null;
}

interface SearchResponse {
  projects_search: {
    edges: Array<{ node: ProjectNode }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

export function registerSearchProjects(server: McpServer): void {
  server.tool(
    "search_projects",
    "Search Atlassian Projects (Townsquare). Returns project key, name, state, and pagination info. Use searchString for TQL filtering.",
    inputSchema,
    async ({ searchString, first, after }) => {
      const { containerIdString } = getClientConfig();

      const q = `
        query SearchProjects($containerId: String!, $searchString: String!, $first: Int!, $after: String) {
          projects_search(
            containerId: $containerId
            searchString: $searchString
            first: $first
            after: $after
          ) @optIn(to: "Townsquare") {
            edges {
              node {
                id
                key
                name
                archived
                state { label }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const data = await graphqlQuery<SearchResponse>(q, {
        containerId: containerIdString,
        searchString: searchString ?? "",
        first: Math.min(first ?? 50, 50),
        after: after ?? null,
      });

      const result = {
        projects: (data.projects_search?.edges ?? []).map((e) => e.node),
        pageInfo: data.projects_search?.pageInfo ?? {
          hasNextPage: false,
          endCursor: null,
        },
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
