const images = new Map<string, Promise<string>>();

async function embedImage(source: string): Promise<string> {
  // A preceding <img> request can cache a response without CORS headers. Reload
  // it as a CORS request before React PDF can silently omit the failed image.
  const response = await fetch(source, {
    mode: "cors",
    credentials: "omit",
    cache: "reload",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Image retrieval returned ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const mime =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      ? "image/jpeg"
      : bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
        ? "image/png"
        : undefined;
  if (!mime) throw new Error("Select a PNG or JPG image");
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return `data:${mime};base64,${btoa(binary)}`;
}

async function prepareImage(source: string | null | undefined, label: string) {
  if (!source || source.startsWith("data:")) return source;
  let pending = images.get(source);
  if (!pending) {
    pending = embedImage(source);
    images.set(source, pending);
    if (images.size > 30) images.delete(images.keys().next().value!);
    void pending.catch(() => {
      if (images.get(source) === pending) images.delete(source);
    });
  }
  try {
    return await pending;
  } catch {
    throw new Error(`Unable to load company ${label} for the PDF. Re-select or upload a PNG/JPG image and try again.`);
  }
}

export async function preparePdfImages<T extends { logo?: string | null; signature?: string | null }>(
  details: T,
): Promise<T> {
  const [logo, signature] = await Promise.all([
    prepareImage(details.logo, "logo"),
    prepareImage(details.signature, "signature"),
  ]);
  return { ...details, logo, signature };
}
