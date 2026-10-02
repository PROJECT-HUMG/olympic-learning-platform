import type { AvatarCrop } from "../types/user.types";

export interface AvatarOffset { x: number; y: number }

// Positions use the crop square's side as one unit, independent of viewport size.
export function getAvatarCrop(width: number, height: number, zoom: number, offset: AvatarOffset) {
  const scale = Math.max(1, Math.min(3, zoom)) / Math.min(width, height);
  const displayWidth = width * scale;
  const displayHeight = height * scale;
  const x = Math.max(-(displayWidth - 1) / 2, Math.min((displayWidth - 1) / 2, offset.x));
  const y = Math.max(-(displayHeight - 1) / 2, Math.min((displayHeight - 1) / 2, offset.y));
  const sourceSide = 1 / scale;
  return {
    displayWidth, displayHeight, offset: { x, y }, sourceSide,
    sourceX: (width - sourceSide) / 2 - x / scale,
    sourceY: (height - sourceSide) / 2 - y / scale,
  };
}

export function getAvatarSelection(width: number, height: number, zoom: number, offset: AvatarOffset): AvatarCrop {
  const crop = getAvatarCrop(width, height, zoom, offset);
  return {
    x: crop.displayWidth === 1 ? .5 : .5 - crop.offset.x / (crop.displayWidth - 1),
    y: crop.displayHeight === 1 ? .5 : .5 - crop.offset.y / (crop.displayHeight - 1),
    zoom: Math.max(1, Math.min(3, zoom)),
  };
}

export function getAvatarOffset(width: number, height: number, crop: AvatarCrop): AvatarOffset {
  const geometry = getAvatarCrop(width, height, crop.zoom, { x: 0, y: 0 });
  return { x: (.5 - crop.x) * (geometry.displayWidth - 1), y: (.5 - crop.y) * (geometry.displayHeight - 1) };
}
