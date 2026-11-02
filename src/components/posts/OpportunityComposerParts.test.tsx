import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { OpportunityChip, OpportunityDetailsDialog, OpportunityHint, useOpportunityDetection } from "./OpportunityComposerParts";
import { defaultOpportunityDraft } from "@/lib/postOpportunity";

afterEach(cleanup);
const tr = (k: string) => k;
const HIRING = "We're hiring a frontend developer in Accra. Apply now with your CV before the deadline!";

describe("useOpportunityDetection", () => {
  it("matches only after the 600 ms debounce and ignores short text", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ t }) => useOpportunityDetection(t, true), { initialProps: { t: HIRING } });
    expect(result.current.match).toBe(false);
    act(() => { vi.advanceTimersByTime(650); });
    expect(result.current.match).toBe(true);
    expect(result.current.type).toBe("EMPLOYMENT");
    rerender({ t: "We're hiring" });
    expect(result.current.match).toBe(false);
    vi.useRealTimers();
  });
  it("stays off when inactive", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useOpportunityDetection(HIRING, false));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.match).toBe(false);
    vi.useRealTimers();
  });
});

describe("hint + chip", () => {
  it("hint is a polite status region with both actions", () => {
    const add = vi.fn(); const no = vi.fn();
    render(<OpportunityHint tr={tr} onAdd={add} onDismiss={no} />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
    fireEvent.click(screen.getByText("addDetails")); fireEvent.click(screen.getByText("notNow"));
    expect(add).toHaveBeenCalled(); expect(no).toHaveBeenCalled();
  });
  it("chip edit/remove are labelled buttons", () => {
    const e = vi.fn(); const r = vi.fn();
    render(<OpportunityChip tr={tr} title="Nurse" onEdit={e} onRemove={r} />);
    fireEvent.click(screen.getByLabelText("edit")); fireEvent.click(screen.getByLabelText("remove"));
    expect(e).toHaveBeenCalled(); expect(r).toHaveBeenCalled();
  });
});

describe("OpportunityDetailsDialog", () => {
  it("saves a valid prefilled draft", () => {
    const onSave = vi.fn();
    render(<OpportunityDetailsDialog open onOpenChange={() => {}} initial={defaultOpportunityDraft(HIRING, "EMPLOYMENT")} onSave={onSave} tr={tr} />);
    expect((screen.getByLabelText("fTitle") as HTMLInputElement).value).toContain("hiring");
    fireEvent.click(screen.getByText("save"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
  it("blocks save and announces an error for a bad link", () => {
    const onSave = vi.fn();
    const initial = { ...defaultOpportunityDraft(HIRING, "EMPLOYMENT"), applicationMethod: "EXTERNAL_LINK" as const, externalLink: "nope" };
    render(<OpportunityDetailsDialog open onOpenChange={() => {}} initial={initial} onSave={onSave} tr={tr} />);
    fireEvent.click(screen.getByText("save"));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("errLink");
  });
});
