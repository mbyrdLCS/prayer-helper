/**
 * Photo uploads are stored publicly on Vercel Blob, so only real image types
 * are allowed — an .html/.svg "photo" served from the blob origin is an XSS
 * vector. The extension comes from the declared type, never the filename.
 */
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

/** Returns a safe file extension for an allowed image type, or null. */
export function imageExtension(file: File): string | null {
  return IMAGE_EXTENSIONS[file.type?.toLowerCase()] ?? null;
}
