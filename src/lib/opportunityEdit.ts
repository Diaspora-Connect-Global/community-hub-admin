/**
 * The opportunity service only accepts detail edits while a listing is a DRAFT
 * ("Can only update opportunity details in DRAFT status"). Every listing this
 * console creates is published straight away, so an edit has to take the
 * listing back to draft first, save, and put it back live if it was live.
 */
export type OpportunityStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export interface EditSteps {
  draft: (id: string) => Promise<unknown>;
  update: (id: string) => Promise<unknown>;
  publish: (id: string) => Promise<unknown>;
}

export async function saveOpportunityEdit(
  id: string,
  status: OpportunityStatus,
  steps: EditSteps,
): Promise<void> {
  if (status === "ARCHIVED") throw new Error("Archived opportunities cannot be edited.");
  if (status === "DRAFT") {
    await steps.update(id);
    return;
  }
  await steps.draft(id);
  const wasLive = status === "PUBLISHED";
  try {
    await steps.update(id);
  } catch (err) {
    // Never leave a live listing stuck as a draft because the edit was refused.
    if (wasLive) await steps.publish(id).catch(() => undefined);
    throw err;
  }
  if (wasLive) await steps.publish(id);
}

/** `<input type="date">` only understands YYYY-MM-DD; the API returns a full timestamp. */
export function toDateInputValue(deadline?: string | null): string {
  return deadline ? deadline.slice(0, 10) : "";
}
