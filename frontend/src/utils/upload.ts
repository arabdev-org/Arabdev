/**
 * Vercel rejects request bodies larger than 4.5 MB, while ArabDev accepts images up to 5 MB.
 * Images above SAFE_BYTES are re-encoded in the browser before upload. The server decodes and
 * re-encodes every image anyway (and scales it far below MAX_SIDE), so nothing visible is lost.
 */
const SAFE_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 2400;

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
}

export async function fitForUpload(file: File): Promise<File> {
  if (file.size <= SAFE_BYTES || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // Browsers that cannot write WebP fall back to PNG, which is usually larger; use JPEG then.
    let blob = await encode(canvas, 'image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await encode(canvas, 'image/jpeg');
    if (!blob || blob.size >= file.size) return file;
    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type });
  } catch {
    return file;
  }
}
