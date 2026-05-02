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

/** Thrown when the server returns a non-empty `errors` array in the response body. */
export class GraphQLRequestError extends Error {
  readonly errors: GraphQLError[];
  constructor(errors: GraphQLError[]) {
    super(errors.map((e) => e.message).join("; "));
    this.name = "GraphQLRequestError";
    this.errors = errors;
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
  timeoutMs = 15_000,
): Promise<TData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    throw new GraphQLUnauthorizedError();
  }

  if (!response.ok) {
    throw new Error("Network error. Please try again.");
  }

  const body = (await response.json()) as GraphQLResponse<TData>;

  if (body.errors?.length) {
    throw new GraphQLRequestError(body.errors);
  }

  if (!body.data) {
    throw new Error("No data returned from GraphQL");
  }

  return body.data;
}
