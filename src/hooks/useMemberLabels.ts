import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import { GraphQLRequestError } from "@/services/graphql/client";
import { userLabel } from "@/lib/userLabel";

interface MemberName {
  fullName?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/** Ids per request. Each alias is one `getMemberDetails` field in a single HTTP call. */
const BATCH_SIZE = 50;

/** Session cache (scope-qualified) so paging back and forth never re-fetches. */
const labelCache = new Map<string, string>();

function batchQuery(count: number): string {
  const vars = Array.from({ length: count }, (_, i) => `$u${i}: ID!`).join(", ");
  const fields = Array.from(
    { length: count },
    (_, i) =>
      `u${i}: getMemberDetails(userId: $u${i}, entityId: $entityId, entityType: $entityType) { fullName displayName firstName lastName email }`,
  ).join("\n");
  return `query ResolveMemberLabels($entityId: ID!, $entityType: String!, ${vars}) {\n${fields}\n}`;
}

function labelOf(m?: MemberName | null): string {
  const combined = [m?.firstName, m?.lastName].filter(Boolean).join(" ").trim();
  return userLabel({ name: m?.fullName?.trim() || m?.displayName?.trim() || combined, email: m?.email }, "");
}

/**
 * Fetch one chunk as a single aliased request. A non-member makes the server
 * return an error for that alias, which fails the whole response here — so the
 * failing aliases are dropped (from the error paths) and the rest retried once.
 */
async function fetchChunk(
  ids: string[],
  entityId: string,
  entityType: string,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  let pending = ids;
  for (let attempt = 0; attempt < 2 && pending.length > 0; attempt++) {
    try {
      const data = await graphqlRequestWithAuth<Record<string, MemberName | null>>(
        batchQuery(pending.length),
        { entityId, entityType, ...Object.fromEntries(pending.map((id, i) => [`u${i}`, id])) },
      );
      pending.forEach((id, i) => {
        const label = labelOf(data[`u${i}`]);
        if (label) out.set(id, label);
      });
      return out;
    } catch (err) {
      if (!(err instanceof GraphQLRequestError)) return out;
      const failed = new Set(err.errors.map((e) => String(e.path?.[0] ?? "")));
      const next = pending.filter((_, i) => !failed.has(`u${i}`));
      if (next.length === pending.length) return out; // not alias-specific — give up
      pending = next;
    }
  }
  return out;
}

/**
 * Resolve user ids to human labels (name, else email) through a
 * community/association's membership records — by default the signed-in
 * admin's own scope.
 *
 * Several surfaces (case reporters, request assignees, note authors, audit
 * actors…) only receive a user id. User ids must never be displayed, so they
 * resolve here and render the label — or their translated "Unknown user"
 * fallback when the person is not (or no longer) a member of the scope.
 *
 * Batched: one aliased request per 50 ids (never one request per row), with a
 * session cache. Returns id → label; unresolved ids are absent.
 */
export function useMemberLabels(
  ids: ReadonlyArray<string | null | undefined>,
  /** Resolve against another entity's membership (e.g. a linked association). */
  scope?: { id: string | null | undefined; entityType: "COMMUNITY" | "ASSOCIATION" },
): ReadonlyMap<string, string> {
  const admin = useAuthStore((s) => s.admin);
  const scopeId = scope ? scope.id ?? "" : admin?.scopeId ?? "";
  const entityType = scope
    ? scope.entityType
    : admin?.scopeType === "ASSOCIATION"
      ? "ASSOCIATION"
      : "COMMUNITY";
  const key = useMemo(
    () => [...new Set(ids.filter((id): id is string => Boolean(id && id.trim())))].sort().join(","),
    [ids],
  );
  const [labels, setLabels] = useState<ReadonlyMap<string, string>>(() => new Map());

  useEffect(() => {
    const unique = key ? key.split(",") : [];
    const cacheKey = (id: string) => `${entityType}:${scopeId}:${id}`;
    const pick = () =>
      new Map(unique.flatMap((id) => (labelCache.has(cacheKey(id)) ? [[id, labelCache.get(cacheKey(id))!]] : [])));
    setLabels(pick());
    const missing = unique.filter((id) => !labelCache.has(cacheKey(id)));
    if (!scopeId || missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      for (let start = 0; start < missing.length; start += BATCH_SIZE) {
        const resolved = await fetchChunk(missing.slice(start, start + BATCH_SIZE), scopeId, entityType);
        resolved.forEach((label, id) => labelCache.set(cacheKey(id), label));
      }
      if (!cancelled) setLabels(pick());
    })();
    return () => {
      cancelled = true;
    };
  }, [key, scopeId, entityType]);

  return labels;
}
