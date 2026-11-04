/** Resolve public, path-style object URLs without requiring a browser build variable. */
export function resolveAssetBaseUrl(config: { publicBaseUrl?: string; endpoint: string; bucket: string }) {
  if (config.publicBaseUrl?.trim()) return config.publicBaseUrl.trim().replace(/\/+$/, "");
  return `${config.endpoint.replace(/\/+$/, "")}/${encodeURIComponent(config.bucket)}`;
}

export function assetUrl(base: string, key: string) {
  return `${base.replace(/\/+$/, "")}/${key
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/")}`;
}

export function resolveStoredAssetUrl(url: string | null | undefined, base: string) {
  if (!url || /^(https?:|data:|blob:)/i.test(url)) return url;
  const key = url.replace(/^(?:undefined|null)\//, "").replace(/^\/+/, "");
  if (url.startsWith("/") && !url.startsWith("//") && !key.split("/").includes("..")) return assetUrl(base, key);
  if (/^[0-9a-f-]{36}\/(?:logo|signature)-[^/]+$/i.test(key)) return assetUrl(base, key);
  return url;
}
