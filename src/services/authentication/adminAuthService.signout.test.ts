import { beforeEach, describe, expect, it } from "vitest";
import { logout } from "./adminAuthService";
import { useAuthStore } from "@/stores/authStore";
import { draftKey, loadDraft, saveDraft } from "@/lib/composerDraft";

const key = draftKey("admin-1", "comm-1");

beforeEach(() => {
  localStorage.clear();
  saveDraft(key, { text: "half a post", visibility: "PUBLIC", mentions: [] });
});

describe("sign-out and post drafts", () => {
  it("a forced logout (refresh failed, session expired) keeps the admin's own draft", () => {
    useAuthStore.getState().logout();
    useAuthStore.getState().clearAuth();
    expect(loadDraft(key)?.text).toBe("half a post");
  });

  it("an explicit sign-out deletes every draft in this browser", () => {
    saveDraft(draftKey("admin-2", "comm-1"), { text: "another admin", visibility: "PUBLIC", mentions: [] });
    logout();
    expect(loadDraft(key)).toBeNull();
    expect(loadDraft(draftKey("admin-2", "comm-1"))).toBeNull();
  });
});
