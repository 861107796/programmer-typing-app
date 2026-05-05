// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

async function register(agent: ReturnType<typeof request.agent>, email: string) {
  await agent.post("/api/auth/register").send({
    email,
    password: "strong-pass-123",
  });
}

describe("admin content routes", () => {
  it("creates a content item and returns it in the filtered list", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await register(agent, "owner@example.com");

    const createResponse = await agent.post("/api/admin/content").send({
      category: "code",
      topic: "typescript",
      difficulty: "medium",
      length: "short",
      label: "Typed formatter",
      prompt: "const formatPrice = (value: number) => value.toFixed(2);",
      isActive: true,
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      category: "code",
      topic: "typescript",
      label: "Typed formatter",
      isActive: true,
    });

    const listResponse = await agent.get(
      "/api/admin/content?category=code&topic=typescript&is_active=true",
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toEqual([
      expect.objectContaining({
        label: "Typed formatter",
        topic: "typescript",
      }),
    ]);
  });

  it("rejects invalid prompt input", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await register(agent, "owner@example.com");

    const response = await agent.post("/api/admin/content").send({
      category: "code",
      topic: "typescript",
      difficulty: "medium",
      length: "short",
      label: "",
      prompt: "   ",
      isActive: true,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Label and prompt are required",
    });
  });

  it("manually assigns a challenge for a date and returns it from the admin query", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await register(agent, "owner@example.com");

    const created = await agent.post("/api/admin/content").send({
      category: "technical",
      topic: "api",
      difficulty: "medium",
      length: "medium",
      label: "Idempotent retry",
      prompt: "Retry idempotent requests with exponential backoff.",
      isActive: true,
    });

    const contentItemId = created.body.id as string;

    const assignResponse = await agent
      .put("/api/admin/daily-challenge/2026-05-05")
      .send({ contentItemId });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body).toMatchObject({
      dateKey: "2026-05-05",
      contentItemId,
      source: "manual",
    });

    const listResponse = await agent.get(
      "/api/admin/daily-challenge?date=2026-05-05",
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.assignments).toEqual([
      expect.objectContaining({
        dateKey: "2026-05-05",
        contentItemId,
        source: "manual",
      }),
    ]);
  });

  it("updates an existing prompt and blocks deleting assigned prompts", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await register(agent, "owner@example.com");

    const createResponse = await agent.post("/api/admin/content").send({
      category: "technical",
      topic: "api",
      difficulty: "medium",
      length: "medium",
      label: "HTTP retry note",
      prompt: "Retry idempotent requests with exponential backoff.",
      isActive: true,
    });

    const contentId = createResponse.body.id as string;

    const updateResponse = await agent.put(`/api/admin/content/${contentId}`).send({
      category: "technical",
      topic: "api",
      difficulty: "hard",
      length: "medium",
      label: "HTTP retry note",
      prompt: "Retry idempotent HTTP requests with exponential backoff.",
      isActive: false,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      difficulty: "hard",
      isActive: false,
    });

    await agent.put("/api/admin/daily-challenge/2026-05-05").send({
      contentItemId: contentId,
    });

    const deleteResponse = await agent.delete(`/api/admin/content/${contentId}`);

    expect(deleteResponse.status).toBe(409);
    expect(deleteResponse.body).toEqual({
      error: "Prompt is assigned to a daily challenge",
    });
  });

  it("generates a stable challenge from active prompts and excludes inactive prompts", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await register(agent, "owner@example.com");

    await agent.post("/api/admin/content").send({
      category: "technical",
      topic: "api",
      difficulty: "medium",
      length: "medium",
      label: "API challenge",
      prompt: "Document retry-safe API calls clearly.",
      isActive: true,
    });

    await agent.post("/api/admin/content").send({
      category: "technical",
      topic: "errors",
      difficulty: "medium",
      length: "medium",
      label: "Inactive challenge",
      prompt: "Read error traces from bottom to top.",
      isActive: false,
    });

    const generated = await agent
      .post("/api/admin/daily-challenge/generate")
      .send({ dateKey: "2026-05-06" });

    expect(generated.status).toBe(200);
    expect(generated.body).toMatchObject({
      dateKey: "2026-05-06",
      source: "generated",
    });

    const generatedAgain = await agent
      .post("/api/admin/daily-challenge/generate")
      .send({ dateKey: "2026-05-06" });

    expect(generatedAgain.body.contentItemId).toBe(generated.body.contentItemId);
  });
});
