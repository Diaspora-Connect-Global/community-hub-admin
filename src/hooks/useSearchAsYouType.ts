import { useEffect, useState } from "react";

export type SearchStatus = "idle" | "tooShort" | "loading" | "success" | "error";

export interface SearchAsYouTypeState<T> {
  status: SearchStatus;
  results: T[];
}

export interface SearchAsYouTypeOptions {
  /** Terms shorter than this never reach the server. */
  minLength?: number;
  /** Wait this long after the last keystroke before searching. */
  debounceMs?: number;
}

/**
 * Debounced, cancellable search for a combobox.
 *
 * - Nothing is sent until the term reaches `minLength` and typing pauses for `debounceMs`.
 * - Every new keystroke aborts the in-flight request (the `signal` reaches `fetch`), so a
 *   slow, stale response can never overwrite a newer one.
 * - `search` must be stable (a module-level function or a memoised callback); a new
 *   function identity restarts the search.
 */
export function useSearchAsYouType<T>(
  query: string,
  search: (term: string, signal: AbortSignal) => Promise<T[]>,
  { minLength = 2, debounceMs = 300 }: SearchAsYouTypeOptions = {},
): SearchAsYouTypeState<T> {
  const [state, setState] = useState<SearchAsYouTypeState<T>>({ status: "idle", results: [] });

  useEffect(() => {
    const term = query.trim();
    if (term.length === 0) {
      setState({ status: "idle", results: [] });
      return;
    }
    if (term.length < minLength) {
      setState({ status: "tooShort", results: [] });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      // Keep the previous results on screen while the new ones load.
      setState((prev) => ({ status: "loading", results: prev.results }));
      search(term, controller.signal).then(
        (results) => {
          if (!controller.signal.aborted) setState({ status: "success", results });
        },
        () => {
          if (!controller.signal.aborted) setState({ status: "error", results: [] });
        },
      );
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, search, minLength, debounceMs]);

  return state;
}
