export const CINEMATIC_VIDEO_SOURCES = {
  light: "/videos/anime-day.mp4",
  dark: "/videos/anime-night.mp4",
} as const;

type PreparedVideo = {
  status: { url: string; progress: number; listeners: Set<(progress: number) => void> };
  promise: Promise<string>;
};

// At most two small videos, shared across scene mounts. Blob URLs live for this
// document, so the video reuses the download that the startup loader waited for.
const preparedVideos = new Map<string, PreparedVideo>();

export function getPreparedVideoSource(source: string) {
  return preparedVideos.get(source)?.status.url || source;
}

export function preloadCinematicVideo(source: string, onProgress: (progress: number) => void) {
  let entry = preparedVideos.get(source);
  if (!entry) {
    const status = { url: "", progress: 0, listeners: new Set<(progress: number) => void>() };
    const promise = (async () => {
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Video request failed: ${response.status}`);
      const total = Number(response.headers.get("content-length")) || 0;
      let blob: Blob;

      if (response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        let loaded = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(new Uint8Array(value));
            loaded += value.byteLength;
            status.progress = total ? Math.min(loaded / total, 0.99) : 0;
            for (const notify of status.listeners) notify(status.progress);
          }
        } finally {
          reader.releaseLock();
        }
        blob = new Blob(chunks, { type: response.headers.get("content-type") || "video/mp4" });
      } else {
        blob = await response.blob();
      }

      status.url = URL.createObjectURL(blob);
      status.progress = 1;
      for (const notify of status.listeners) notify(1);
      return status.url;
    })().catch((error: unknown) => {
      preparedVideos.delete(source);
      throw error;
    });
    entry = { status, promise };
    preparedVideos.set(source, entry);
  }

  const current = entry;
  current.status.listeners.add(onProgress);
  onProgress(current.status.progress);
  return current.promise.finally(() => current.status.listeners.delete(onProgress));
}
