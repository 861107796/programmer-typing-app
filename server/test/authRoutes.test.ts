// @vitest-environment node

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("auth backend bootstrap", () => {
  it("responds to unauthenticated me requests", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
  });

  it("registers a user with valid email and password", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const response = await request(app).post("/api/auth/register").send({
      email: "dev@example.com",
      password: "strong-pass-123",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("dev@example.com");
    expect(response.body.user).not.toHaveProperty("password_hash");
  });

  it("rejects duplicate email registration", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    await request(app).post("/api/auth/register").send({
      email: "dup@example.com",
      password: "strong-pass-123",
    });

    const duplicate = await request(app).post("/api/auth/register").send({
      email: "dup@example.com",
      password: "strong-pass-123",
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({ error: "Email already registered" });
  });

  it("logs in a user with valid credentials", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    await request(app).post("/api/auth/register").send({
      email: "login@example.com",
      password: "strong-pass-123",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "strong-pass-123",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("login@example.com");
  });

  it("rejects invalid credentials", async () => {
    const app = await createApp({ databasePath: ":memory:" });

    const response = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "wrong-pass",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials" });
  });

  it("returns the authenticated user from /api/auth/me", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "session@example.com",
      password: "strong-pass-123",
    });

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("session@example.com");
  });

  it("clears the session on logout", async () => {
    const app = await createApp({ databasePath: ":memory:" });
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "logout@example.com",
      password: "strong-pass-123",
    });

    await agent.post("/api/auth/logout");
    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
  });
});
