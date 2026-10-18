import assert from "node:assert/strict";
import { it } from "node:test";
import { validatePostImage } from "../src/features/post/lib/post-image-validation.ts";

it("POST image validation preserves MIME family, inclusive 5MiB and error precedence", () => {
  for (const type of ["image/png", "image/jpeg", "image/gif", "image/svg+xml"]) {
    assert.equal(validatePostImage({ type, size: 5 * 1024 * 1024 }), null);
    assert.equal(validatePostImage({ type, size: 5 * 1024 * 1024 + 1 }), "size");
  }
  for (const type of ["", "text/plain", "application/pdf", "IMAGE/PNG"]) {
    assert.equal(validatePostImage({ type, size: 1 }), "type");
    assert.equal(validatePostImage({ type, size: 10 * 1024 * 1024 }), "type");
  }
  assert.equal(validatePostImage({ type: "image/png", size: 0 }), null, "server validation remains authoritative for content");
});
