import axios from "axios";

export interface ClientConfig {
  graphqlEndpoint: string;
  headers: Record<string, string>;
  containerIdARI: string;
  containerIdString: string;
  cloudId: string;
}

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your MCP client config or .env file.`
    );
  }
  return value;
}

export function getClientConfig(): ClientConfig {
  const baseUrl = getEnvOrThrow("ATLASSIAN_BASE_URL").replace(/\/+$/, "");
  const email = getEnvOrThrow("ATLASSIAN_EMAIL");
  const apiToken = getEnvOrThrow("ATLASSIAN_API_TOKEN");
  const cloudId = getEnvOrThrow("ATLASSIAN_CLOUD_ID");

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const containerIdARI = `ari:cloud:townsquare::site/${cloudId}`;

  return {
    graphqlEndpoint: `${baseUrl}/gateway/api/graphql`,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Query-Context": `ari:cloud:jira::site/${cloudId}`,
    },
    containerIdARI,
    containerIdString: containerIdARI,
    cloudId,
  };
}

export async function graphqlQuery<T = unknown>(
  queryText: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const { graphqlEndpoint, headers } = getClientConfig();
  const response = await axios.post(
    graphqlEndpoint,
    { query: queryText, variables },
    { headers }
  );
  if (response.data.errors) {
    throw new Error(
      `Atlassian GraphQL errors: ${JSON.stringify(response.data.errors)}`
    );
  }
  return response.data.data as T;
}
