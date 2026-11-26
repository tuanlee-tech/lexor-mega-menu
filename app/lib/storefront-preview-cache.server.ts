export interface CachedPreviewEntry {
  html: string;
  storefrontUrl: string;
  cachedAt: number;
}

const previewHtmlCache = new Map<string, CachedPreviewEntry>();

export function getCachedStorefrontPreview(cacheKey: string): CachedPreviewEntry | undefined {
  return previewHtmlCache.get(cacheKey);
}

export function setCachedStorefrontPreview(cacheKey: string, entry: CachedPreviewEntry) {
  previewHtmlCache.set(cacheKey, entry);
}

export function invalidateStorefrontPreviewCache(shop: string) {
  for (const key of previewHtmlCache.keys()) {
    if (key.startsWith(`${shop}:`)) {
      previewHtmlCache.delete(key);
    }
  }
}
