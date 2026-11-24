import { describe, it, expect, vi, afterEach } from "vitest";
import { SIGNED_CACHE_CONTROL, signedUploadHeaders, uploadFileToSignedUrl } from "./uploadFileToSignedUrl";

// Shape of the real URLs from community-service / event-service / post-feed-service.
const SIGNED_WITH_CACHE =
  "https://storage.googleapis.com/diaspoplug-media/communities/c-1/cover-x.jpeg" +
  "?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Expires=900" +
  "&X-Goog-SignedHeaders=cache-control%3Bcontent-type%3Bhost&X-Goog-Signature=abc";
const SIGNED_WITHOUT_CACHE =
  "https://storage.googleapis.com/diaspoplug-media/resources/r-1/files/v-1.pdf" +
  "?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-SignedHeaders=content-type%3Bhost&X-Goog-Signature=abc";

describe("signedUploadHeaders", () => {
  it("sends Cache-Control when the URL was signed over it (a missing signed header is a 400)", () => {
    expect(signedUploadHeaders(SIGNED_WITH_CACHE, "image/jpeg")).toEqual({
      "Content-Type": "image/jpeg",
      "Cache-Control": SIGNED_CACHE_CONTROL,
    });
  });

  it("leaves uploads to services that do not sign it unchanged", () => {
    expect(signedUploadHeaders(SIGNED_WITHOUT_CACHE, "application/pdf")).toEqual({
      "Content-Type": "application/pdf",
    });
  });

  it("copes with a URL it cannot parse", () => {
    expect(signedUploadHeaders("not a url", "image/png")).toEqual({ "Content-Type": "image/png" });
  });

  it("uses the exact value the backend signs", () => {
    expect(SIGNED_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
  });
});

describe("uploadFileToSignedUrl", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("PUTs the file with the signed headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "cover.jpeg", { type: "image/jpeg" });

    await uploadFileToSignedUrl(SIGNED_WITH_CACHE, file, "image/jpeg");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(SIGNED_WITH_CACHE);
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ "Content-Type": "image/jpeg", "Cache-Control": SIGNED_CACHE_CONTROL });
    expect(init.body).toBe(file);
  });

  it("throws on a refused upload so the page does not report success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, statusText: "Bad Request" }));
    await expect(uploadFileToSignedUrl(SIGNED_WITH_CACHE, new Blob(["x"]), "image/jpeg")).rejects.toThrow("400");
  });
});
