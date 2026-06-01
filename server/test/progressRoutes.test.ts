// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("progress bootstrap", () => {
  it("returns an empty progress snapshot for a newly registered user", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "progress@example.com",
      password: "strong-pass-123",
    });

    const response = await agent.get("/api/progress");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sessions: [],
      achievements: [],
      dailyChallenge: null,
    });
  });

  it("saves a completed session and returns updated progress", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "save@example.com",
      password: "strong-pass-123",
    });

    const response = await agent.post("/api/sessions").send({
      mode: "mixed",
      category: "mixed",
      durationMs: 42000,
      totalChars: 120,
      correctChars: 118,
      errorCount: 2,
      wpm: 67,
      accuracy: 98,
      valid: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.sessions).toHaveLength(1);
    expect(response.body.sessions[0]).toMatchObject({
      mode: "mixed",
      category: "mixed",
      wpm: 67,
    });
    expect(response.body.achievements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "speed-20", unlocked: true }),
        expect.objectContaining({ id: "accuracy-98", unlocked: true }),
      ]),
    );
    expect(response.body.dailyChallenge).toBeNull();
  });

  it("updates achievements and daily challenge when saving a session", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "derived@example.com",
      password: "strong-pass-123",
    });

    const response = await agent.post("/api/sessions").send({
      mode: "daily",
      category: "technical",
      durationMs: 20000,
      totalChars: 80,
      correctChars: 79,
      errorCount: 1,
      wpm: 80,
      accuracy: 99,
      valid: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.achievements.length).toBeGreaterThan(0);
    expect(response.body.dailyChallenge).toMatchObject({
      completed: true,
      bestWpm: 80,
      bestAccuracy: 99,
    });
  });
});
