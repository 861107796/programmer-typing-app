// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("content routes", () => {
  it("returns a mixed session queue from database content", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const response = await request(app).get("/api/content/session?mode=mixed");

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
  });

  it("returns a focused session queue filtered by category", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const response = await request(app).get(
      "/api/content/session?mode=focused&category=command",
    );

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(
      response.body.items.every(
        (item: { category: string }) => item.category === "command",
      ),
    ).toBe(true);
  });
});
