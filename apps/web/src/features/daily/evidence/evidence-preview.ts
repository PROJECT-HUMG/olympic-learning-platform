/** MIME/name alone are not trusted. Only bounded raster headers can be displayed. */
export function evidenceRaster(bytes: Uint8Array): string | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, count: number) => String.fromCharCode(...bytes.slice(offset, offset + count));
  const bounded = (w: number, h: number) => w > 0 && h > 0 && w <= 8000 && h <= 8000 && w * h <= 24_000_000;
  if (bytes.length >= 33 && bytes.slice(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]) && text(12, 4) === "IHDR") return bounded(view.getUint32(16), view.getUint32(20)) ? "image/png" : null;
  if (bytes.length >= 13 && ["GIF87a", "GIF89a"].includes(text(0, 6))) return bounded(view.getUint16(6, true), view.getUint16(8, true)) ? "image/gif" : null;
  if (bytes.length >= 30 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    const u24 = (i: number) => bytes[i] | bytes[i + 1] << 8 | bytes[i + 2] << 16;
    if (text(12, 4) === "VP8X") return bounded(u24(24) + 1, u24(27) + 1) ? "image/webp" : null;
    if (text(12, 4) === "VP8 " && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) return bounded(view.getUint16(26, true) & 16383, view.getUint16(28, true) & 16383) ? "image/webp" : null;
    if (text(12, 4) === "VP8L" && bytes[20] === 47) { const bits = view.getUint32(21, true); return bounded((bits & 16383) + 1, (bits >>> 14 & 16383) + 1) ? "image/webp" : null; }
  }
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) return null;
      while (offset < bytes.length && bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) return null;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      if (offset + 2 > bytes.length) return null;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return null;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 8) return bounded(view.getUint16(offset + 5), view.getUint16(offset + 3)) ? "image/jpeg" : null;
      offset += length;
    }
  }
  return null;
}
export function evidenceIsImage(type: string | null): boolean { return /^(image\/(png|jpeg|gif|webp))$/i.test(type ?? ""); }
