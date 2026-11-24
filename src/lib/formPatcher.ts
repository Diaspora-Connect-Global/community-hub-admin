/**
 * Build a `set(patch)` for a form whose state lives in the parent.
 *
 * Spreading the render-time form (`onChange({ ...form, ...patch })`) loses an
 * update when two patches happen in the same tick: the second spreads the old
 * form again. This keeps the latest value in a ref, so consecutive patches
 * compose.
 */
export function createFormPatcher<T extends object>(
  latest: { current: T },
  onChange: (next: T) => void,
): (patch: Partial<T>) => void {
  return (patch) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    onChange(next);
  };
}
