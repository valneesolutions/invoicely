/** Resolve public, path-style object URLs without requiring a browser build variable. */
export function resolveAssetBaseUrl(config: { publicBaseUrl?: string; endpoint: string; bucket: string }) {
  if (config.publicBaseUrl?.trim()) return config.publicBaseUrl.trim().replace(/\/+$/, "");
  return `${config.endpoint.replace(/\/+$/, "")}/${encodeURIComponent(config.bucket)}`;
}

export function assetUrl(base: string, key: string) {
  return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")}`;
}

export function resolveStoredAssetUrl(url: string | null | undefined, base: string) {
  if (!url?.startsWith("/") || url.startsWith("//")) return url;
  return assetUrl(base, url);
}
