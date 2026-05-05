// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

async function register(
  agent: ReturnType<typeof request.agent>,
  email: string,
) {
  await agent.post("/api/auth/register").send({
    email,
    password: "strong-pass-123",
  });
}

describe("leaderboard routes", () => {
  it("returns a daily top 100 ordered by wpm, accuracy, and earliest completion time", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const alpha = request.agent(app);
    const beta = request.agent(app);
    const gamma = request.agent(app);

    await register(alpha, "alpha@example.com");
    await register(beta, "beta@example.com");
    await register(gamma, "gamma@example.com");

    await alpha.post("/api/sessions").send({
      mode: "daily",
      category: "technical",
      durationMs: 21000,
      totalChars: 90,
      correctChars: 88,
      errorCount: 2,
      wpm: 84,
      accuracy: 97,
      valid: true,
    });

    await beta.post("/api/sessions").send({
      mode: "daily",
      category: "technical",
      durationMs: 21000,
      totalChars: 90,
      correctChars: 89,
      errorCount: 1,
      wpm: 84,
      accuracy: 99,
      valid: true,
    });

    await gamma.post("/api/sessions").send({
      mode: "daily",
      category: "technical",
      durationMs: 19000,
      totalChars: 90,
      correctChars: 90,
      errorCount: 0,
      wpm: 92,
      accuracy: 100,
      valid: true,
    });

    const response = await gamma.get("/api/leaderboard/daily");

    expect(response.status).toBe(200);
    expect(response.body.entries.slice(0, 3)).toEqual([
      expect.objectContaining({
        rank: 1,
        displayName: "gamma",
        wpm: 92,
        accuracy: 100,
      }),
      expect.objectContaining({
        rank: 2,
        displayName: "beta",
        wpm: 84,
        accuracy: 99,
      }),
      expect.objectContaining({
        rank: 3,
        displayName: "alpha",
        wpm: 84,
        accuracy: 97,
      }),
    ]);
  });

  it("returns global top scores and the signed-in user's personal ranks", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const alpha = request.agent(app);
    const beta = request.agent(app);

    await register(alpha, "alpha@example.com");
    await register(beta, "beta@example.com");

    await alpha.post("/api/sessions").send({
      mode: "mixed",
      category: "mixed",
      durationMs: 18000,
      totalChars: 90,
      correctChars: 89,
      errorCount: 1,
      wpm: 95,
      accuracy: 99,
      valid: true,
    });

    await beta.post("/api/sessions").send({
      mode: "mixed",
      category: "mixed",
      durationMs: 18000,
      totalChars: 90,
      correctChars: 90,
      errorCount: 0,
      wpm: 101,
      accuracy: 100,
      valid: true,
    });

    const globalResponse = await alpha.get("/api/leaderboard/global");
    const meResponse = await alpha.get("/api/leaderboard/me");

    expect(globalResponse.status).toBe(200);
    expect(globalResponse.body.entries.slice(0, 2)).toEqual([
      expect.objectContaining({ rank: 1, displayName: "beta", wpm: 101 }),
      expect.objectContaining({ rank: 2, displayName: "alpha", wpm: 95 }),
    ]);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual({
      daily: null,
      global: expect.objectContaining({
        rank: 2,
        displayName: "alpha",
        wpm: 95,
        accuracy: 99,
      }),
    });
  });

  it("rejects unauthenticated leaderboard requests", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const response = await request(app).get("/api/leaderboard/daily");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("limits leaderboard responses to the top 100 entries", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agents = await Promise.all(
      Array.from({ length: 105 }, async (_, index) => {
        const agent = request.agent(app);
        await register(agent, `dev${index}@example.com`);
        await agent.post("/api/sessions").send({
          mode: "mixed",
          category: "mixed",
          durationMs: 20000,
          totalChars: 100,
          correctChars: 100,
          errorCount: 0,
          wpm: 200 - index,
          accuracy: 100,
          valid: true,
        });
        return agent;
      }),
    );

    const response = await agents[0].get("/api/leaderboard/global");

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(100);
    expect(response.body.entries[0]).toMatchObject({
      rank: 1,
      displayName: "dev0",
    });
    expect(response.body.entries.at(-1)).toMatchObject({
      rank: 100,
      displayName: "dev99",
    });
  }, 20_000);
});
