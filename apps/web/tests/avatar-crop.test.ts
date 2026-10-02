import assert from "node:assert/strict";
import { it } from "node:test";
import { getAvatarCrop, getAvatarOffset, getAvatarSelection } from "../src/features/user/lib/avatar-crop.ts";

it("centers a square crop without distorting wide, tall or square images", () => {
  for (const [width, height] of [[1200, 600], [600, 1200], [600, 600]]) {
    const crop = getAvatarCrop(width, height, 1, { x: 0, y: 0 });
    assert.equal(crop.sourceSide, 600);
    assert.equal(crop.sourceX, (width - 600) / 2);
    assert.equal(crop.sourceY, (height - 600) / 2);
    assert.equal(crop.displayWidth / crop.displayHeight, width / height);
  }
});

it("round trips persisted framing and matches cover, object-position and transform-origin", () => {
  for (const [width, height] of [[1200, 600], [600, 1200], [600, 600]]) {
    for (const zoom of [1, 1.5, 3]) for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) {
      const geometry = getAvatarCrop(width, height, zoom, { x, y });
      const saved = getAvatarSelection(width, height, zoom, { x, y });
      const restored = getAvatarOffset(width, height, saved);
      assert.ok(Math.abs(restored.x - geometry.offset.x) < 1e-9);
      assert.ok(Math.abs(restored.y - geometry.offset.y) < 1e-9);
      const cssLeft = (1 - geometry.displayWidth) * saved.x;
      const cssTop = (1 - geometry.displayHeight) * saved.y;
      assert.ok(Math.abs(cssLeft - (.5 + geometry.offset.x - geometry.displayWidth / 2)) < 1e-9);
      assert.ok(Math.abs(cssTop - (.5 + geometry.offset.y - geometry.displayHeight / 2)) < 1e-9);
    }
  }
});

it("keeps the crop inside the original image even when dragged beyond every edge", () => {
  for (const [width, height] of [[1200, 600], [600, 1200], [600, 600], [1, 1]]) {
    for (const zoom of [1, 1.05, 2, 3]) {
      for (const x of [-100, 0, 100]) for (const y of [-100, 0, 100]) {
        const crop = getAvatarCrop(width, height, zoom, { x, y });
        assert.ok(crop.sourceX >= -1e-9 && crop.sourceY >= -1e-9);
        assert.ok(crop.sourceX + crop.sourceSide <= width + 1e-9);
        assert.ok(crop.sourceY + crop.sourceSide <= height + 1e-9);
      }
    }
  }
});

it("matches the selected image position and clamps it when zooming back out", () => {
  const zoomed = getAvatarCrop(1200, 600, 2, { x: .5, y: -.5 });
  assert.equal(zoomed.sourceX, 300);
  assert.equal(zoomed.sourceY, 300);
  assert.equal(zoomed.sourceSide, 300);
  const reset = getAvatarCrop(1200, 600, 1, zoomed.offset);
  assert.equal(Math.abs(reset.offset.y), 0);
  assert.equal(reset.sourceY, 0);
});
