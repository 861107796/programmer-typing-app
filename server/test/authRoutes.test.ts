// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("auth backend bootstrap", () => {
  it("responds to unauthenticated me requests", async () => {
    const app = await createApp();
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
  });
});
