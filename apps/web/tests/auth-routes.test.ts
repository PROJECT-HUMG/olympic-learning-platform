import assert from "node:assert/strict";
import { it } from "node:test";
import { getPostLoginRoute, ROUTES } from "../src/router/route-constants.ts";

it("returns to a local room invitation after login for every role", () => {
  const invitation = "/study-rooms/example?invite=1#music";
  for (const role of ["STUDENT", "LECTURER", "ADMIN", undefined]) {
    assert.equal(getPostLoginRoute(role, invitation), invitation);
  }
});

it("rejects external, malformed and account return paths", () => {
  for (const from of [undefined, {}, "https://example.com", "//example.com", "/\\example.com", "/room\n", "/room path", "/login", "/LOGIN/", "/register/?from=room", "/forgot-password", "/reset-password?token=x", "/verify-email#x"]) {
    assert.equal(getPostLoginRoute("STUDENT", from), ROUTES.DASHBOARD);
  }
  assert.equal(getPostLoginRoute("ADMIN", null), ROUTES.ADMIN);
  assert.equal(getPostLoginRoute("LECTURER", null), ROUTES.LECTURER);
});
