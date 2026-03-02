const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "/graphql";

export interface GraphQLError {
  message: string;
  path?: string[];
  extensions?: Record<string, unknown>;
}

/** Thrown when the server returns HTTP 401 (e.g. expired access token). */
export class GraphQLUnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "GraphQLUnauthorizedError";
  }
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

export async function graphqlRequest<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  accessToken?: string,
): Promise<TData> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (response.status === 401) {
    throw new GraphQLUnauthorizedError();
  }

  if (!response.ok) {
    throw new Error(`Network error: ${response.status}`);
  }

  const body = (await response.json()) as GraphQLResponse<TData>;

  if (body.errors?.length) {
    throw new Error(body.errors[0]?.message ?? "Unknown GraphQL error");
  }

  if (!body.data) {
    throw new Error("No data returned from GraphQL");
  }

  return body.data;
}

