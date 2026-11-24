/**
 * Event cover image URLs.
 *
 * Only a real http(s) address is a usable cover. A `blob:` URL is a browser-local
 * preview that dies with the tab, a `data:` URL is a multi-MB inline image and a
 * relative or `javascript:` value can never load from the storage bucket, so none
 * of those may be saved or rendered.
 */
export function usableCoverImageUrl(value: string | null | undefined): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}
